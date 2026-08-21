import { PoolClient } from 'pg';
import { bomRepository, BomFilterParams } from '../repositories/bom.repository';
import { productRepository } from '../repositories/product.repository';
import { bomStateMachineService } from './bomStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  Bom,
  BomItem,
  CreateBomInput,
  UpdateBomInput,
  CreateBomItemInput,
  UpdateBomItemInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  BomNotFoundError,
  BomComponentNotFoundError,
  BomProductNotFoundError,
  BomSelfReferenceError,
  BomDuplicateBomNumberError,
  BomDuplicateRevisionError,
  BomDuplicateComponentError,
  BomDefaultConflictError,
  BomEffectiveDateError,
  BomInvalidQuantityError,
  BomInvalidScrapPercentageError,
  BomImmutableError,
  BomCircularDependencyError,
  ValidationError,
} from '../types';
import {
  toDecimal,
  formatDecimal,
  compareDecimal,
  MONEY_SCALE,
} from '../utils/decimal';

export interface CreateBomComponentData {
  component_product_id: string;
  quantity: number | string;
  unit?: string;
  scrap_percentage?: number | string;
  sequence?: number;
  notes?: string | null;
}

export interface CreateBomServiceInput {
  organization_id: string;
  product_id: string;
  bom_number?: string;
  revision?: string;
  name?: string;
  status?: 'draft';
  effective_from?: Date | string | null;
  effective_to?: Date | string | null;
  is_default?: boolean;
  notes?: string | null;
  components?: CreateBomComponentData[];
}

export interface BomWithComponents extends Bom {
  items: BomItem[];
  bom_material_cost?: string;
}

export class BomService {
  private async generateBomNumber(
    organizationId: string,
    productSku: string,
    tx?: PoolClient,
  ): Promise<string> {
    const cleanSku = productSku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `BOM-${cleanSku}-${timestamp}${random}`;

    let existing = await bomRepository.findByBomNumber(organizationId, candidate, tx);
    while (existing) {
      const nextRandom = Math.floor(1000 + Math.random() * 9000);
      candidate = `BOM-${cleanSku}-${timestamp}${nextRandom}`;
      existing = await bomRepository.findByBomNumber(organizationId, candidate, tx);
    }
    return candidate;
  }

  private async checkCircularDependency(
    organizationId: string,
    parentProductId: string,
    candidateComponentProductId: string,
    tx?: PoolClient,
  ): Promise<void> {
    if (candidateComponentProductId === parentProductId) {
      throw new BomSelfReferenceError('BOM parent product cannot be used as a component product');
    }

    const visitedProductIds = new Set<string>([parentProductId, candidateComponentProductId]);
    let queue = [candidateComponentProductId];
    let depth = 0;

    while (queue.length > 0 && depth < 50) {
      const nextQueue: string[] = [];
      for (const prodId of queue) {
        const boms = await bomRepository.findByProductId(organizationId, prodId, tx);
        for (const bom of boms) {
          if (bom.status === 'archived') continue;
          const items = await bomRepository.listComponents(organizationId, bom.id, tx);
          for (const item of items) {
            if (item.component_product_id === parentProductId) {
              throw new BomCircularDependencyError(
                `Circular dependency detected: component product '${candidateComponentProductId}' eventually references parent product '${parentProductId}'`,
              );
            }
            if (!visitedProductIds.has(item.component_product_id)) {
              visitedProductIds.add(item.component_product_id);
              nextQueue.push(item.component_product_id);
            }
          }
        }
      }
      queue = nextQueue;
      depth++;
    }
  }

  private async calculateMaterialCost(
    organizationId: string,
    items: BomItem[],
    tx?: PoolClient,
  ): Promise<string> {
    let totalCost = toDecimal(0);
    for (const item of items) {
      const product = await productRepository.findById(organizationId, item.component_product_id, tx);
      if (product) {
        const pCost = toDecimal(product.cost || product.price || 0);
        const qty = toDecimal(item.quantity);
        const scrapPct = toDecimal(item.scrap_percentage || 0);
        let effectiveQty = qty;
        if (compareDecimal(scrapPct, 0) > 0 && compareDecimal(scrapPct, 100) < 0) {
          const divisor = toDecimal(100).minus(scrapPct);
          effectiveQty = qty.times(100).dividedBy(divisor);
        }
        const itemTotal = effectiveQty.times(pCost);
        totalCost = totalCost.plus(itemTotal);
      }
    }
    return formatDecimal(totalCost, MONEY_SCALE);
  }

  async createBom(
    input: CreateBomServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<BomWithComponents> {
    return withTransaction(async (tx) => {
      // 1. Validate Parent Product
      const parentProduct = await productRepository.findById(
        input.organization_id,
        input.product_id,
        tx,
      );
      if (!parentProduct) {
        throw new BomProductNotFoundError(`Product with ID ${input.product_id} not found`);
      }

      // 2. Circular Reference Protection in Components Payload
      if (input.components) {
        for (const comp of input.components) {
          await this.checkCircularDependency(
            input.organization_id,
            input.product_id,
            comp.component_product_id,
            tx,
          );
        }
      }

      // 3. BOM Number Handling & Duplicate Check
      let bomNumber = input.bom_number?.trim();
      if (bomNumber) {
        const existing = await bomRepository.findByBomNumber(
          input.organization_id,
          bomNumber,
          tx,
        );
        if (existing) {
          throw new BomDuplicateBomNumberError(`BOM number '${bomNumber}' already exists`);
        }
      } else {
        bomNumber = await this.generateBomNumber(
          input.organization_id,
          parentProduct.sku,
          tx,
        );
      }

      // 4. Revision Handling & Duplicate Check
      let revision = input.revision?.trim();
      if (!revision) {
        const latest = await bomRepository.findLatestRevision(
          input.organization_id,
          input.product_id,
          tx,
        );
        const lastRevNum = latest ? parseInt(latest.revision, 10) || 0 : 0;
        revision = String(lastRevNum + 1);
      }

      const dupRev = await bomRepository.findByProductAndRevision(
        input.organization_id,
        input.product_id,
        revision,
        tx,
      );
      if (dupRev) {
        throw new BomDuplicateRevisionError(
          `BOM revision '${revision}' already exists for product ${parentProduct.sku}`,
        );
      }

      // 5. Effective Date Validation
      if (input.effective_from && input.effective_to) {
        const from = new Date(input.effective_from).getTime();
        const to = new Date(input.effective_to).getTime();
        if (to < from) {
          throw new BomEffectiveDateError(
            'Effective end date cannot be earlier than effective start date',
          );
        }
      }

      // 6. Component Validation
      const componentInputs: CreateBomItemInput[] = [];
      if (input.components && input.components.length > 0) {
        const seenComponents = new Set<string>();

        for (let i = 0; i < input.components.length; i++) {
          const comp = input.components[i]!;

          if (seenComponents.has(comp.component_product_id)) {
            throw new BomDuplicateComponentError(
              `Duplicate component product ${comp.component_product_id} in BOM payload`,
            );
          }
          seenComponents.add(comp.component_product_id);

          const compProduct = await productRepository.findById(
            input.organization_id,
            comp.component_product_id,
            tx,
          );
          if (!compProduct) {
            throw new BomProductNotFoundError(
              `Component product with ID ${comp.component_product_id} not found`,
            );
          }

          const qtyNum = Number(comp.quantity);
          if (isNaN(qtyNum) || qtyNum <= 0) {
            throw new BomInvalidQuantityError('Component quantity must be greater than zero');
          }

          const scrapNum = comp.scrap_percentage !== undefined ? Number(comp.scrap_percentage) : 0;
          if (isNaN(scrapNum) || scrapNum < 0 || scrapNum > 100) {
            throw new BomInvalidScrapPercentageError('Scrap percentage must be between 0 and 100');
          }

          componentInputs.push({
            organization_id: input.organization_id,
            bom_id: '', // set after header creation
            component_product_id: comp.component_product_id,
            quantity: qtyNum,
            unit: comp.unit || compProduct.unit || 'pcs',
            scrap_percentage: scrapNum,
            sequence: comp.sequence !== undefined ? comp.sequence : i + 1,
            notes: comp.notes || null,
          });
        }
      }

      // 7. Create Header
      const headerData: CreateBomInput = {
        organization_id: input.organization_id,
        product_id: input.product_id,
        bom_number: bomNumber,
        bom_code: bomNumber,
        revision: revision,
        name: input.name || `${parentProduct.name} - Rev ${revision}`,
        status: 'draft',
        effective_from: input.effective_from || null,
        effective_to: input.effective_to || null,
        is_default: false,
        notes: input.notes || null,
        created_by: userId || null,
      };

      const bom = await bomRepository.create(headerData, tx);

      // 8. Create Components
      const createdItems: BomItem[] = [];
      for (const compInput of componentInputs) {
        const createdComp = await bomRepository.createComponent(
          { ...compInput, bom_id: bom.id },
          tx,
        );
        createdItems.push(createdComp);
      }

      // 9. Audit Log
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'BOM',
          entity_id: bom.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_CREATED',
            bom_id: bom.id,
            bom_number: bom.bom_number,
            product_id: bom.product_id,
            revision: bom.revision,
            component_count: createdItems.length,
          },
        },
        tx,
      );

      return {
        ...bom,
        items: createdItems,
      };
    });
  }

  async getBom(organizationId: string, id: string): Promise<BomWithComponents> {
    const result = await bomRepository.findByIdWithComponents(organizationId, id);
    if (!result) {
      throw new BomNotFoundError(`BOM with ID ${id} not found`);
    }
    const materialCost = await this.calculateMaterialCost(organizationId, result.items);
    return {
      ...result,
      bom_material_cost: materialCost,
    };
  }

  async listBoms(
    organizationId: string,
    params?: BomFilterParams,
  ): Promise<PaginatedResult<Bom>> {
    return bomRepository.listBoms(organizationId, params || {});
  }

  async deleteBom(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${id} not found`);
      }

      if (bom.status === 'active') {
        throw new BomImmutableError('Active BOMs cannot be deleted directly. Deactivate first.');
      }

      const deleted = await bomRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'BOM',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_DELETED',
            bom_id: id,
            bom_number: bom.bom_number,
            product_id: bom.product_id,
          },
        },
        tx,
      );

      const { businessEventService } = await import('./businessEvent.service');
      await businessEventService.emit({
        eventName: 'BOM_DELETED',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { bom_id: id, product_id: bom.product_id },
        client: tx,
      });

      return deleted;
    });
  }

  async updateBom(
    organizationId: string,
    id: string,
    updateData: UpdateBomInput,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${id} not found`);
      }

      if (bom.status === 'archived') {
        throw new BomImmutableError('Archived BOMs cannot be modified');
      }

      if (updateData.effective_from !== undefined || updateData.effective_to !== undefined) {
        const effFrom =
          updateData.effective_from !== undefined ? updateData.effective_from : bom.effective_from;
        const effTo =
          updateData.effective_to !== undefined ? updateData.effective_to : bom.effective_to;

        if (effFrom && effTo) {
          const from = new Date(effFrom).getTime();
          const to = new Date(effTo).getTime();
          if (to < from) {
            throw new BomEffectiveDateError(
              'Effective end date cannot be earlier than effective start date',
            );
          }
        }
      }

      const updated = (await bomRepository.update(
        organizationId,
        id,
        {
          ...updateData,
          updated_by: userId || null,
        },
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'BOM',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_UPDATED',
            bom_id: id,
            updated_fields: Object.keys(updateData),
          },
        },
        tx,
      );

      return updated;
    });
  }

  async addComponent(
    organizationId: string,
    bomId: string,
    componentData: CreateBomComponentData,
    userId?: string,
    requestId?: string,
  ): Promise<BomItem> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${bomId} not found`);
      }

      if (bom.status !== 'draft') {
        throw new BomImmutableError(
          `Components can only be added when BOM status is DRAFT (current status: '${bom.status}')`,
        );
      }

      await this.checkCircularDependency(
        organizationId,
        bom.product_id,
        componentData.component_product_id,
        tx,
      );

      const compProduct = await productRepository.findById(
        organizationId,
        componentData.component_product_id,
        tx,
      );
      if (!compProduct) {
        throw new BomProductNotFoundError(
          `Component product with ID ${componentData.component_product_id} not found`,
        );
      }

      const qtyNum = Number(componentData.quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        throw new BomInvalidQuantityError('Component quantity must be greater than zero');
      }

      const scrapNum =
        componentData.scrap_percentage !== undefined ? Number(componentData.scrap_percentage) : 0;
      if (isNaN(scrapNum) || scrapNum < 0 || scrapNum > 100) {
        throw new BomInvalidScrapPercentageError('Scrap percentage must be between 0 and 100');
      }

      const existingComp = await bomRepository.findComponentByBomAndProduct(
        organizationId,
        bomId,
        componentData.component_product_id,
        tx,
      );
      if (existingComp) {
        throw new BomDuplicateComponentError(
          `Component product ${componentData.component_product_id} already exists in this BOM`,
        );
      }

      const newItem = await bomRepository.createComponent(
        {
          organization_id: organizationId,
          bom_id: bomId,
          component_product_id: componentData.component_product_id,
          quantity: qtyNum,
          unit: componentData.unit || compProduct.unit || 'pcs',
          scrap_percentage: scrapNum,
          sequence: componentData.sequence !== undefined ? componentData.sequence : 1,
          notes: componentData.notes || null,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'BOM',
          entity_id: bomId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_COMPONENT_ADDED',
            bom_id: bomId,
            component_id: newItem.id,
            component_product_id: newItem.component_product_id,
            quantity: newItem.quantity,
          },
        },
        tx,
      );

      return newItem;
    });
  }

  async updateComponent(
    organizationId: string,
    bomId: string,
    componentId: string,
    updateData: UpdateBomItemInput,
    userId?: string,
    requestId?: string,
  ): Promise<BomItem> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${bomId} not found`);
      }

      if (bom.status !== 'draft') {
        throw new BomImmutableError(
          `Components can only be modified when BOM status is DRAFT (current status: '${bom.status}')`,
        );
      }

      const existingComp = await bomRepository.findComponentById(organizationId, componentId, tx);
      if (!existingComp || existingComp.bom_id !== bomId) {
        throw new BomComponentNotFoundError(`BOM component with ID ${componentId} not found`);
      }

      if (updateData.quantity !== undefined) {
        const qtyNum = Number(updateData.quantity);
        if (isNaN(qtyNum) || qtyNum <= 0) {
          throw new BomInvalidQuantityError('Component quantity must be greater than zero');
        }
      }

      if (updateData.scrap_percentage !== undefined) {
        const scrapNum = Number(updateData.scrap_percentage);
        if (isNaN(scrapNum) || scrapNum < 0 || scrapNum > 100) {
          throw new BomInvalidScrapPercentageError('Scrap percentage must be between 0 and 100');
        }
      }

      const updatedComp = (await bomRepository.updateComponent(
        organizationId,
        componentId,
        updateData,
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'BOM',
          entity_id: bomId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_COMPONENT_UPDATED',
            bom_id: bomId,
            component_id: componentId,
          },
        },
        tx,
      );

      return updatedComp;
    });
  }

  async removeComponent(
    organizationId: string,
    bomId: string,
    componentId: string,
    userId?: string,
    requestId?: string,
  ): Promise<void> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${bomId} not found`);
      }

      if (bom.status !== 'draft') {
        throw new BomImmutableError(
          `Components can only be removed when BOM status is DRAFT (current status: '${bom.status}')`,
        );
      }

      const existingComp = await bomRepository.findComponentById(organizationId, componentId, tx);
      if (!existingComp || existingComp.bom_id !== bomId) {
        throw new BomComponentNotFoundError(`BOM component with ID ${componentId} not found`);
      }

      await bomRepository.deleteComponent(organizationId, componentId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'BOM',
          entity_id: bomId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_COMPONENT_REMOVED',
            bom_id: bomId,
            component_id: componentId,
          },
        },
        tx,
      );
    });
  }

  async activateBom(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return bomStateMachineService.transitionState(
      organizationId,
      id,
      'active',
      userId,
      requestId,
    );
  }

  async deactivateBom(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return bomStateMachineService.transitionState(
      organizationId,
      id,
      'inactive',
      userId,
      requestId,
    );
  }

  async archiveBom(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return bomStateMachineService.transitionState(
      organizationId,
      id,
      'archived',
      userId,
      requestId,
    );
  }

  async createRevision(
    organizationId: string,
    bomId: string,
    userId?: string,
    requestId?: string,
  ): Promise<BomWithComponents> {
    return withTransaction(async (tx) => {
      const sourceBom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!sourceBom) {
        throw new BomNotFoundError(`Source BOM with ID ${bomId} not found`);
      }

      const parentProduct = await productRepository.findById(
        organizationId,
        sourceBom.product_id,
        tx,
      );
      if (!parentProduct) {
        throw new BomProductNotFoundError(`Product ${sourceBom.product_id} not found`);
      }

      // Calculate next revision
      const allProductBoms = await bomRepository.findByProductId(
        organizationId,
        sourceBom.product_id,
        tx,
      );

      let maxRev = 0;
      for (const b of allProductBoms) {
        const rNum = parseInt(b.revision, 10);
        if (!isNaN(rNum) && rNum > maxRev) {
          maxRev = rNum;
        }
      }
      const nextRevision = String(maxRev + 1);

      const newBomNumber = await this.generateBomNumber(
        organizationId,
        parentProduct.sku,
        tx,
      );

      // Create new DRAFT revision header
      const newHeaderData: CreateBomInput = {
        organization_id: organizationId,
        product_id: sourceBom.product_id,
        bom_number: newBomNumber,
        bom_code: newBomNumber,
        revision: nextRevision,
        name: `${parentProduct.name} - Rev ${nextRevision}`,
        status: 'draft',
        effective_from: sourceBom.effective_from,
        effective_to: sourceBom.effective_to,
        is_default: false,
        notes: sourceBom.notes ? `Revision from BOM ${sourceBom.bom_number}: ${sourceBom.notes}` : `Revision from BOM ${sourceBom.bom_number}`,
        created_by: userId || null,
      };

      const newBom = await bomRepository.create(newHeaderData, tx);

      // Copy components from source BOM
      const sourceComponents = await bomRepository.listComponents(
        organizationId,
        sourceBom.id,
        tx,
      );

      const newComponents: BomItem[] = [];
      for (const comp of sourceComponents) {
        const copied = await bomRepository.createComponent(
          {
            organization_id: organizationId,
            bom_id: newBom.id,
            component_product_id: comp.component_product_id,
            quantity: comp.quantity,
            unit: comp.unit,
            scrap_percentage: comp.scrap_percentage,
            sequence: comp.sequence,
            notes: comp.notes,
          },
          tx,
        );
        newComponents.push(copied);
      }

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'BOM',
          entity_id: newBom.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_REVISION_CREATED',
            source_bom_id: sourceBom.id,
            new_bom_id: newBom.id,
            new_revision: nextRevision,
            copied_components: newComponents.length,
          },
        },
        tx,
      );

      return {
        ...newBom,
        items: newComponents,
      };
    });
  }

  async setDefaultBom(
    organizationId: string,
    bomId: string,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${bomId} not found`);
      }

      if (bom.status !== 'active') {
        throw new BomDefaultConflictError(
          `Only active BOMs can be set as default (current status: '${bom.status}')`,
        );
      }

      const updated = (await bomRepository.setDefaultBom(organizationId, bomId, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'BOM',
          entity_id: bomId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'BOM_DEFAULT_CHANGED',
            bom_id: bomId,
            product_id: updated.product_id,
            is_default: true,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async getProductBoms(
    organizationId: string,
    productId: string,
  ): Promise<Bom[]> {
    const product = await productRepository.findById(organizationId, productId);
    if (!product) {
      throw new ValidationError(`Product with ID ${productId} not found`);
    }

    return bomRepository.findByProductId(organizationId, productId);
  }
}

export const bomService = new BomService();
