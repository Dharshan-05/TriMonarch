import { bomRepository } from '../repositories/bom.repository';
import { productRepository } from '../repositories/product.repository';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { Bom, BomStatus } from '../types/database';
import {
  BomNotFoundError,
  BomEmptyError,
  BomInvalidStateTransitionError,
  BomAlreadyInStateError,
  BomEffectiveDateError,
  BomProductNotFoundError,
} from '../types';

export class BomStateMachineService {
  private readonly allowedTransitions: Record<BomStatus, BomStatus[]> = {
    draft: ['active', 'archived'],
    active: ['inactive', 'archived'],
    inactive: ['active', 'archived'],
    archived: [],
  };

  public canTransition(currentStatus: BomStatus, targetStatus: BomStatus): boolean {
    if (currentStatus === targetStatus) return false;
    const allowed = this.allowedTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  async transitionState(
    organizationId: string,
    bomId: string,
    targetStatus: BomStatus,
    userId?: string,
    requestId?: string,
  ): Promise<Bom> {
    return withTransaction(async (tx) => {
      const bom = await bomRepository.lockByIdForUpdate(organizationId, bomId, tx);
      if (!bom) {
        throw new BomNotFoundError(`BOM with ID ${bomId} not found`);
      }

      if (bom.status === targetStatus) {
        throw new BomAlreadyInStateError(targetStatus);
      }

      if (!this.canTransition(bom.status, targetStatus)) {
        throw new BomInvalidStateTransitionError(bom.status, targetStatus);
      }

      // Transition specific validations & side effects
      let isDefaultUpdated = bom.is_default;

      if (targetStatus === 'active') {
        // 1. Must have components
        const components = await bomRepository.listComponents(organizationId, bomId, tx);
        if (!components || components.length === 0) {
          throw new BomEmptyError(`BOM ${bom.bom_number} has no components and cannot be activated`);
        }

        // 2. Validate Parent Product
        const parentProduct = await productRepository.findById(organizationId, bom.product_id, tx);
        if (!parentProduct) {
          throw new BomProductNotFoundError(`Parent product ${bom.product_id} not found`);
        }

        // 3. Validate Component Products
        for (const comp of components) {
          const compProduct = await productRepository.findById(
            organizationId,
            comp.component_product_id,
            tx,
          );
          if (!compProduct) {
            throw new BomProductNotFoundError(`Component product ${comp.component_product_id} not found`);
          }
        }

        // 4. Effective Date Range Check
        if (bom.effective_from && bom.effective_to) {
          const from = new Date(bom.effective_from).getTime();
          const to = new Date(bom.effective_to).getTime();
          if (to < from) {
            throw new BomEffectiveDateError('Effective end date cannot be earlier than effective start date');
          }
        }
      }

      if (targetStatus === 'inactive' || targetStatus === 'archived') {
        // If BOM was default, unset default
        if (bom.is_default) {
          isDefaultUpdated = false;
        }
      }

      const updated = (await bomRepository.update(
        organizationId,
        bomId,
        {
          status: targetStatus,
          is_default: isDefaultUpdated,
          updated_by: userId || null,
        },
        tx,
      ))!;

      // Audit Log Event
      let auditAction: 'BOM_ACTIVATED' | 'BOM_DEACTIVATED' | 'BOM_ARCHIVED' = 'BOM_ACTIVATED';
      if (targetStatus === 'active') auditAction = 'BOM_ACTIVATED';
      if (targetStatus === 'inactive') auditAction = 'BOM_DEACTIVATED';
      if (targetStatus === 'archived') auditAction = 'BOM_ARCHIVED';

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
            event: auditAction,
            bom_id: bomId,
            bom_number: updated.bom_number,
            previous_status: bom.status,
            new_status: targetStatus,
          },
        },
        tx,
      );

      return updated;
    });
  }
}

export const bomStateMachineService = new BomStateMachineService();
