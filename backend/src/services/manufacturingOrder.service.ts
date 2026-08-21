import { PoolClient } from 'pg';
import { manufacturingRepository, ManufacturingOrderFilterParams } from '../repositories/manufacturing.repository';
import { productRepository } from '../repositories/product.repository';
import { bomRepository } from '../repositories/bom.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { bomExplosionService } from './bomExplosion.service';
import { componentAvailabilityService } from './componentAvailability.service';
import { manufacturingOrderStateMachineService } from './manufacturingOrderStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  ManufacturingOrder,
  ManufacturingOrderItem,
  CreateManufacturingOrderInput,
  UpdateManufacturingOrderInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import { toDecimal, isValidDecimalString } from '../utils/decimal';
import {
  ManufacturingOrderNotFoundError,
  ManufacturingOrderBomNotFoundError,
  ManufacturingOrderBomInactiveError,
  ManufacturingOrderProductMismatchError,
  ManufacturingOrderWarehouseNotFoundError,
  ProductNotFoundError,
  DuplicateManufacturingOrderNumberError,
  InvalidManufacturingOrderQuantityError,
  ManufacturingOrderImmutableError,
  ValidationError,
} from '../types';

export interface CreateManufacturingOrderServiceInput {
  organization_id: string;
  product_id: string;
  bom_id: string;
  warehouse_id: string;
  order_number?: string;
  mo_number?: string;
  planned_quantity: number | string;
  planned_start_date?: Date | string | null;
  planned_end_date?: Date | string | null;
  notes?: string | null;
}

export interface ManufacturingOrderWithItems extends ManufacturingOrder {
  items: ManufacturingOrderItem[];
}

export class ManufacturingOrderService {
  private async generateMoNumber(
    organizationId: string,
    tx?: PoolClient,
  ): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `MO-${dateStr}-${random}`;

    let existing = await manufacturingRepository.findByOrderNumber(organizationId, candidate, tx);
    while (existing) {
      const nextRand = Math.floor(1000 + Math.random() * 9000);
      candidate = `MO-${dateStr}-${nextRand}`;
      existing = await manufacturingRepository.findByOrderNumber(organizationId, candidate, tx);
    }
    return candidate;
  }

  async createOrder(
    input: CreateManufacturingOrderServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<ManufacturingOrderWithItems> {
    return withTransaction(async (tx) => {
      // 1. Validate Product
      const product = await productRepository.findById(input.organization_id, input.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${input.product_id} not found`);
      }

      // 2. Validate Warehouse
      const warehouse = await warehouseRepository.findById(input.organization_id, input.warehouse_id, tx);
      if (!warehouse) {
        throw new ManufacturingOrderWarehouseNotFoundError(
          `Warehouse with ID ${input.warehouse_id} not found`,
        );
      }

      // 3. Validate BOM
      const bom = await bomRepository.findById(input.organization_id, input.bom_id, tx);
      if (!bom) {
        throw new ManufacturingOrderBomNotFoundError(`BOM with ID ${input.bom_id} not found`);
      }
      if (bom.status !== 'active') {
        throw new ManufacturingOrderBomInactiveError(
          `BOM ${bom.bom_number} is not active (status: '${bom.status}')`,
        );
      }
      if (bom.product_id !== input.product_id) {
        throw new ManufacturingOrderProductMismatchError(
          `BOM ${bom.bom_number} belongs to product ${bom.product_id}, not requested product ${input.product_id}`,
        );
      }

      // Effective dates check
      if (bom.effective_from && new Date(bom.effective_from) > new Date()) {
        throw new ManufacturingOrderBomInactiveError(`BOM ${bom.bom_number} is not yet effective`);
      }
      if (bom.effective_to && new Date(bom.effective_to) < new Date()) {
        throw new ManufacturingOrderBomInactiveError(`BOM ${bom.bom_number} has expired`);
      }

      // 4. Validate Planned Quantity
      const qtyStr = String(input.planned_quantity).trim();
      if (!isValidDecimalString(qtyStr)) {
        throw new InvalidManufacturingOrderQuantityError(
          'Planned quantity must be a valid numeric decimal',
        );
      }
      const plannedQty = toDecimal(qtyStr);
      if (plannedQty.lte(0)) {
        throw new InvalidManufacturingOrderQuantityError(
          'Planned quantity must be a positive number greater than zero',
        );
      }

      // 5. Handle MO Number & Duplicate Check
      let moNumber = (input.mo_number || input.order_number)?.trim();
      if (moNumber) {
        const existing = await manufacturingRepository.findByOrderNumber(
          input.organization_id,
          moNumber,
          tx,
        );
        if (existing) {
          throw new DuplicateManufacturingOrderNumberError(
            `Manufacturing order number '${moNumber}' already exists in organization`,
          );
        }
      } else {
        moNumber = await this.generateMoNumber(input.organization_id, tx);
      }

      // 6. Run BOM Explosion to Calculate Material Component Requirements
      const explosionResult = await bomExplosionService.explodeBom({
        organization_id: input.organization_id,
        product_id: input.product_id,
        bom_id: input.bom_id,
        quantity: plannedQty.toString(),
      });

      // 7. Create Manufacturing Order Header
      const headerInput: CreateManufacturingOrderInput = {
        organization_id: input.organization_id,
        bom_id: input.bom_id,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        order_number: moNumber,
        mo_number: moNumber,
        planned_quantity: plannedQty.toString(),
        completed_quantity: '0.0000',
        scheduled_start_date: input.planned_start_date || null,
        scheduled_end_date: input.planned_end_date || null,
        planned_start_date: input.planned_start_date || null,
        planned_end_date: input.planned_end_date || null,
        status: 'draft',
        notes: input.notes || null,
        created_by: userId || null,
      };

      const mo = await manufacturingRepository.create(headerInput, tx);

      // 8. Create MO Items / Component Requirements
      const items: ManufacturingOrderItem[] = [];
      for (let i = 0; i < explosionResult.components.length; i++) {
        const comp = explosionResult.components[i]!;
        const item = await manufacturingRepository.createItem(
          {
            organization_id: input.organization_id,
            manufacturing_order_id: mo.id,
            component_product_id: comp.product_id,
            bom_item_id: null,
            required_quantity: comp.required_quantity,
            consumed_quantity: '0.0000',
            unit: comp.unit_of_measure,
            sequence: i + 1,
            notes: `Component requirement for ${comp.product_code}`,
          },
          tx,
        );
        items.push(item);
      }

      // 9. Audit Event
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: mo.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_ORDER_CREATED',
            manufacturing_order_id: mo.id,
            mo_number: mo.order_number,
            product_id: mo.product_id,
            bom_id: mo.bom_id,
            warehouse_id: mo.warehouse_id,
            planned_quantity: mo.planned_quantity,
            component_count: items.length,
          },
        },
        tx,
      );

      const { businessEventService } = await import('./businessEvent.service');
      await businessEventService.emit({
        eventName: 'MANUFACTURING_ORDER_CREATED',
        organization_id: input.organization_id,
        user_id: userId,
        request_id: requestId,
        metadata: { manufacturing_order_id: mo.id, product_id: mo.product_id },
        client: tx,
      });

      return {
        ...mo,
        items,
      };
    });
  }

  async deleteOrder(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
      }

      if (mo.status !== 'draft' && mo.status !== 'cancelled') {
        throw new ManufacturingOrderImmutableError(
          `Manufacturing order can only be deleted when status is DRAFT or CANCELLED (current status: '${mo.status}')`,
        );
      }

      const deleted = await manufacturingRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_ORDER_DELETED',
            manufacturing_order_id: id,
            order_number: mo.order_number,
            product_id: mo.product_id,
          },
        },
        tx,
      );

      const { businessEventService } = await import('./businessEvent.service');
      await businessEventService.emit({
        eventName: 'MANUFACTURING_ORDER_DELETED',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { manufacturing_order_id: id, product_id: mo.product_id },
        client: tx,
      });

      return deleted;
    });
  }

  async getMaterials(organizationId: string, id: string) {
    const mo = await manufacturingRepository.findById(organizationId, id);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
    }
    const availability = await componentAvailabilityService.checkManufacturingOrderAvailability(
      organizationId,
      id,
      undefined,
      mo,
    );
    const overallStatus = availability.ready ? 'available' : availability.components.some((c) => c.available) ? 'partial' : 'shortage';
    return {
      availabilityStatus: overallStatus,
      materials: availability.components.map((c) => ({
        component: c.product_code || c.product_id,
        product_id: c.product_id,
        requiredQuantity: c.required_quantity,
        availableQuantity: c.available_quantity,
        reservedQuantity: c.reserved_quantity,
        consumedQuantity: '0.0000',
        shortageQuantity: c.shortage_quantity,
        availabilityStatus: c.available ? 'available' : 'shortage',
      })),
    };
  }

  async materialCheck(organizationId: string, id: string) {
    const materialsResult = await this.getMaterials(organizationId, id);
    return {
      available: materialsResult.availabilityStatus === 'available',
      materials: materialsResult.materials,
    };
  }

  async getOrder(
    organizationId: string,
    id: string,
  ): Promise<ManufacturingOrderWithItems> {
    const result = await manufacturingRepository.findByIdWithItems(organizationId, id);
    if (!result) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
    }
    return result;
  }

  async listOrders(
    organizationId: string,
    params?: ManufacturingOrderFilterParams,
  ): Promise<PaginatedResult<ManufacturingOrder>> {
    return manufacturingRepository.listOrders(organizationId, params || {});
  }

  async getOrderItems(
    organizationId: string,
    id: string,
  ): Promise<ManufacturingOrderItem[]> {
    const mo = await manufacturingRepository.findById(organizationId, id);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
    }
    return manufacturingRepository.listItems(organizationId, id);
  }

  async updateOrder(
    organizationId: string,
    id: string,
    updateData: UpdateManufacturingOrderInput,
    userId?: string,
    requestId?: string,
  ): Promise<ManufacturingOrderWithItems> {
    return withTransaction(async (tx) => {
      const mo = await manufacturingRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!mo) {
        throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
      }

      if (mo.status !== 'draft') {
        throw new ManufacturingOrderImmutableError(
          `Manufacturing order can only be modified when status is DRAFT (current status: '${mo.status}')`,
        );
      }

      const targetProductId = updateData.product_id || mo.product_id;
      const targetBomId = updateData.bom_id || mo.bom_id;
      const targetWarehouseId =
        updateData.warehouse_id !== undefined ? updateData.warehouse_id : mo.warehouse_id;
      const targetQtyStr =
        updateData.planned_quantity !== undefined
          ? String(updateData.planned_quantity)
          : String(mo.planned_quantity);

      // Validate quantity if provided/changed
      const plannedQty = toDecimal(targetQtyStr);
      if (plannedQty.lte(0)) {
        throw new InvalidManufacturingOrderQuantityError(
          'Planned quantity must be a positive number greater than zero',
        );
      }

      // Re-validate Warehouse if provided
      if (targetWarehouseId) {
        const warehouse = await warehouseRepository.findById(organizationId, targetWarehouseId, tx);
        if (!warehouse) {
          throw new ManufacturingOrderWarehouseNotFoundError(
            `Warehouse with ID ${targetWarehouseId} not found`,
          );
        }
      }

      // Re-validate BOM & Product if changed
      const bom = await bomRepository.findById(organizationId, targetBomId, tx);
      if (!bom) {
        throw new ManufacturingOrderBomNotFoundError(`BOM with ID ${targetBomId} not found`);
      }
      if (bom.status !== 'active') {
        throw new ManufacturingOrderBomInactiveError(`BOM ${bom.bom_number} is not active`);
      }
      if (bom.product_id !== targetProductId) {
        throw new ManufacturingOrderProductMismatchError(
          `BOM ${bom.bom_number} does not match product ${targetProductId}`,
        );
      }

      // Regenerate BOM requirements if quantity or BOM changed
      let items: ManufacturingOrderItem[] = [];
      const isQtyOrBomChanged =
        updateData.planned_quantity !== undefined ||
        updateData.bom_id !== undefined ||
        updateData.product_id !== undefined;

      if (isQtyOrBomChanged) {
        const explosionResult = await bomExplosionService.explodeBom({
          organization_id: organizationId,
          product_id: targetProductId,
          bom_id: targetBomId,
          quantity: plannedQty.toString(),
        });

        // Delete old items
        await manufacturingRepository.deleteItemsByOrderId(organizationId, id, tx);

        // Re-create items
        for (let i = 0; i < explosionResult.components.length; i++) {
          const comp = explosionResult.components[i]!;
          const item = await manufacturingRepository.createItem(
            {
              organization_id: organizationId,
              manufacturing_order_id: id,
              component_product_id: comp.product_id,
              bom_item_id: null,
              required_quantity: comp.required_quantity,
              consumed_quantity: '0.0000',
              unit: comp.unit_of_measure,
              sequence: i + 1,
              notes: `Component requirement for ${comp.product_code}`,
            },
            tx,
          );
          items.push(item);
        }
      } else {
        items = await manufacturingRepository.listItems(organizationId, id, tx);
      }

      // Update Header
      const updatedMo = (await manufacturingRepository.update(
        organizationId,
        id,
        {
          ...updateData,
          planned_quantity: plannedQty.toString(),
          updated_by: userId || null,
        },
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'MANUFACTURING_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'MANUFACTURING_ORDER_UPDATED',
            manufacturing_order_id: id,
            updated_fields: Object.keys(updateData),
          },
        },
        tx,
      );

      return {
        ...updatedMo,
        items,
      };
    });
  }

  // Lifecycle Transitions
  async confirmOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'confirmed',
      userId,
      reason,
      requestId,
    );
  }

  async planOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'planned',
      userId,
      reason,
      requestId,
    );
  }

  async releaseOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'released',
      userId,
      reason,
      requestId,
    );
  }

  async startOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'in_progress',
      userId,
      reason,
      requestId,
    );
  }

  async cancelOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'cancelled',
      userId,
      reason,
      requestId,
    );
  }

  async completeOrder(
    organizationId: string,
    id: string,
    userId?: string,
    reason?: string,
    requestId?: string,
  ): Promise<ManufacturingOrder> {
    return manufacturingOrderStateMachineService.transitionState(
      organizationId,
      id,
      'completed',
      userId,
      reason,
      requestId,
    );
  }

  async getStatusHistory(organizationId: string, id: string) {
    const mo = await manufacturingRepository.findById(organizationId, id);
    if (!mo) {
      throw new ManufacturingOrderNotFoundError(`Manufacturing order with ID ${id} not found`);
    }
    return manufacturingRepository.listStatusHistory(organizationId, id);
  }

  async getOrdersByProduct(
    organizationId: string,
    productId: string,
  ): Promise<ManufacturingOrder[]> {
    const product = await productRepository.findById(organizationId, productId);
    if (!product) {
      throw new ValidationError(`Product with ID ${productId} not found`);
    }
    return manufacturingRepository.findByProductId(organizationId, productId);
  }

  async getOrdersByWarehouse(
    organizationId: string,
    warehouseId: string,
  ): Promise<ManufacturingOrder[]> {
    const warehouse = await warehouseRepository.findById(organizationId, warehouseId);
    if (!warehouse) {
      throw new ManufacturingOrderWarehouseNotFoundError(`Warehouse with ID ${warehouseId} not found`);
    }
    return manufacturingRepository.findByWarehouseId(organizationId, warehouseId);
  }
}

export const manufacturingOrderService = new ManufacturingOrderService();
