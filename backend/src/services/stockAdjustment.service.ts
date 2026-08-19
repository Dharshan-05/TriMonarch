import { inventoryRepository } from '../repositories/inventory.repository';
import { productRepository } from '../repositories/product.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { stockLedgerRepository } from '../repositories/stockLedger.repository';
import { stockReservationRepository } from '../repositories/stockReservation.repository';
import { Inventory, StockLedgerEntry } from '../types/database';
import {
  ValidationError,
  NegativeStockError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  ZeroStockAdjustmentError,
  AdjustmentWouldViolateReservationError,
} from '../types';
import { BaseFilterParams, PaginatedResult } from '../repositories/base';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  toDecimal,
  formatDecimal,
  addDecimal,
  subtractDecimal,
  compareDecimal,
  QUANTITY_SCALE,
} from '../utils/decimal';
import { createStockAdjustmentSchema } from '../schemas/stockAdjustment.schema';

export interface StockAdjustmentInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  delta_quantity?: string | number;
  target_quantity?: string | number;
  reason?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
}

export interface StockAdjustmentPreview {
  current_on_hand: string;
  active_reserved: string;
  current_available: string;
  requested_delta: string;
  resulting_on_hand: string;
  resulting_available: string;
  allowed: boolean;
  rejection_reason?: string;
}

export interface StockAdjustmentResult {
  inventory: Inventory;
  adjustment_quantity: string;
  previous_quantity: string;
  new_quantity: string;
  previous_available_quantity: string;
  new_available_quantity: string;
  active_reserved_quantity: string;
}

export class StockAdjustmentService {
  async adjustStock(
    input: StockAdjustmentInput,
    userId?: string,
    requestId?: string,
  ): Promise<StockAdjustmentResult> {
    const parseResult = createStockAdjustmentSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError('Invalid stock adjustment payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || input.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    return withTransaction(async (tx) => {
      const product = await productRepository.findById(organizationId, validated.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${validated.product_id} not found`);
      }

      const warehouse = await warehouseRepository.findById(organizationId, validated.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${validated.warehouse_id} not found`);
      }

      // Concurrency lock on inventory row (create if missing safely under concurrency)
      let inv = await inventoryRepository.ensureInventoryRowLocked(
        organizationId,
        validated.product_id,
        validated.warehouse_id,
        '0.0000',
        tx,
      );

      const oldOnHandStr = formatDecimal(inv.quantity, QUANTITY_SCALE);
      const activeReservedStr = await stockReservationRepository.getSumActiveQuantity(
        organizationId,
        validated.product_id,
        validated.warehouse_id,
        tx,
      );
      const oldAvailableStr = subtractDecimal(oldOnHandStr, activeReservedStr, QUANTITY_SCALE);

      let newOnHandDecimal;
      let deltaStr = '0.0000';

      if (validated.target_quantity !== undefined) {
        newOnHandDecimal = toDecimal(validated.target_quantity);
        deltaStr = subtractDecimal(newOnHandDecimal, oldOnHandStr, QUANTITY_SCALE);
      } else if (validated.delta_quantity !== undefined) {
        const deltaDec = toDecimal(validated.delta_quantity);
        deltaStr = formatDecimal(deltaDec, QUANTITY_SCALE);
        newOnHandDecimal = toDecimal(addDecimal(oldOnHandStr, deltaStr, QUANTITY_SCALE));
      } else {
        throw new ValidationError('Either delta_quantity or target_quantity must be provided');
      }

      // Zero adjustment rejection
      if (compareDecimal(deltaStr, 0) === 0) {
        throw new ZeroStockAdjustmentError('Stock adjustment quantity delta cannot be zero');
      }

      // Negative stock guard
      if (compareDecimal(newOnHandDecimal, 0) < 0) {
        throw new NegativeStockError('Stock adjustment results in negative inventory balance');
      }

      // Active reservation protection guard
      if (compareDecimal(newOnHandDecimal, activeReservedStr) < 0) {
        throw new AdjustmentWouldViolateReservationError(
          `Stock adjustment to ${formatDecimal(
            newOnHandDecimal,
            QUANTITY_SCALE,
          )} would violate active stock reservations of ${activeReservedStr} (current on-hand: ${oldOnHandStr}, available: ${oldAvailableStr})`,
        );
      }

      const newOnHandStr = formatDecimal(newOnHandDecimal, QUANTITY_SCALE);

      inv = (await inventoryRepository.updateQuantity(organizationId, inv.id, newOnHandStr, tx))!;

      const ledgerNotes = `[Reason: ${validated.reason || 'OTHER'}] ${validated.notes || ''}`.trim();

      await stockLedgerRepository.create(
        {
          organization_id: organizationId,
          product_id: validated.product_id,
          warehouse_id: validated.warehouse_id,
          movement_type: 'ADJUSTMENT',
          quantity: deltaStr,
          reference_type: validated.reference_type || 'adjustment',
          reference_id: validated.reference_id || null,
          notes: ledgerNotes,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: inv.id,
          request_id: requestId,
          success: true,
          metadata: {
            movement_type: 'ADJUSTMENT',
            reason: validated.reason || 'OTHER',
            product_id: validated.product_id,
            warehouse_id: validated.warehouse_id,
            quantity_delta: deltaStr,
            previous_quantity: oldOnHandStr,
            new_quantity: newOnHandStr,
            active_reserved: activeReservedStr,
            reference_type: validated.reference_type,
            reference_id: validated.reference_id,
          },
        },
        tx,
      );

      const newAvailableStr = subtractDecimal(newOnHandStr, activeReservedStr, QUANTITY_SCALE);

      return {
        inventory: inv,
        adjustment_quantity: deltaStr,
        previous_quantity: oldOnHandStr,
        new_quantity: newOnHandStr,
        previous_available_quantity: oldAvailableStr,
        new_available_quantity: newAvailableStr,
        active_reserved_quantity: activeReservedStr,
      };
    });
  }

  async adjustToTarget(
    input: Omit<StockAdjustmentInput, 'delta_quantity'> & { target_quantity: string | number },
    userId?: string,
    requestId?: string,
  ): Promise<StockAdjustmentResult> {
    return this.adjustStock({ ...input, target_quantity: input.target_quantity }, userId, requestId);
  }

  async getAdjustmentPreview(
    organizationId: string,
    productId: string,
    warehouseId: string,
    quantityInput: { delta_quantity?: string | number; target_quantity?: string | number },
  ): Promise<StockAdjustmentPreview> {
    const inv = await inventoryRepository.findByProductAndWarehouse(organizationId, productId, warehouseId);
    const oldOnHandStr = inv ? formatDecimal(inv.quantity, QUANTITY_SCALE) : '0.0000';
    const activeReservedStr = await stockReservationRepository.getSumActiveQuantity(
      organizationId,
      productId,
      warehouseId,
    );
    const oldAvailableStr = subtractDecimal(oldOnHandStr, activeReservedStr, QUANTITY_SCALE);

    let newOnHandDecimal;
    let deltaStr = '0.0000';

    try {
      if (quantityInput.target_quantity !== undefined) {
        newOnHandDecimal = toDecimal(quantityInput.target_quantity);
        deltaStr = subtractDecimal(newOnHandDecimal, oldOnHandStr, QUANTITY_SCALE);
      } else if (quantityInput.delta_quantity !== undefined) {
        const deltaDec = toDecimal(quantityInput.delta_quantity);
        deltaStr = formatDecimal(deltaDec, QUANTITY_SCALE);
        newOnHandDecimal = toDecimal(addDecimal(oldOnHandStr, deltaStr, QUANTITY_SCALE));
      } else {
        return {
          current_on_hand: oldOnHandStr,
          active_reserved: activeReservedStr,
          current_available: oldAvailableStr,
          requested_delta: '0.0000',
          resulting_on_hand: oldOnHandStr,
          resulting_available: oldAvailableStr,
          allowed: false,
          rejection_reason: 'Either delta_quantity or target_quantity must be provided',
        };
      }
    } catch {
      return {
        current_on_hand: oldOnHandStr,
        active_reserved: activeReservedStr,
        current_available: oldAvailableStr,
        requested_delta: '0.0000',
        resulting_on_hand: oldOnHandStr,
        resulting_available: oldAvailableStr,
        allowed: false,
        rejection_reason: 'Invalid quantity decimal format',
      };
    }

    if (compareDecimal(deltaStr, 0) === 0) {
      return {
        current_on_hand: oldOnHandStr,
        active_reserved: activeReservedStr,
        current_available: oldAvailableStr,
        requested_delta: deltaStr,
        resulting_on_hand: oldOnHandStr,
        resulting_available: oldAvailableStr,
        allowed: false,
        rejection_reason: 'Stock adjustment delta cannot be zero',
      };
    }

    if (compareDecimal(newOnHandDecimal, 0) < 0) {
      return {
        current_on_hand: oldOnHandStr,
        active_reserved: activeReservedStr,
        current_available: oldAvailableStr,
        requested_delta: deltaStr,
        resulting_on_hand: formatDecimal(newOnHandDecimal, QUANTITY_SCALE),
        resulting_available: subtractDecimal(newOnHandDecimal, activeReservedStr, QUANTITY_SCALE),
        allowed: false,
        rejection_reason: 'Stock adjustment results in negative inventory balance',
      };
    }

    if (compareDecimal(newOnHandDecimal, activeReservedStr) < 0) {
      return {
        current_on_hand: oldOnHandStr,
        active_reserved: activeReservedStr,
        current_available: oldAvailableStr,
        requested_delta: deltaStr,
        resulting_on_hand: formatDecimal(newOnHandDecimal, QUANTITY_SCALE),
        resulting_available: subtractDecimal(newOnHandDecimal, activeReservedStr, QUANTITY_SCALE),
        allowed: false,
        rejection_reason: `Stock adjustment would violate active stock reservations of ${activeReservedStr}`,
      };
    }

    const newOnHandStr = formatDecimal(newOnHandDecimal, QUANTITY_SCALE);
    const newAvailableStr = subtractDecimal(newOnHandStr, activeReservedStr, QUANTITY_SCALE);

    return {
      current_on_hand: oldOnHandStr,
      active_reserved: activeReservedStr,
      current_available: oldAvailableStr,
      requested_delta: deltaStr,
      resulting_on_hand: newOnHandStr,
      resulting_available: newAvailableStr,
      allowed: true,
    };
  }

  async getAdjustmentHistory(
    organizationId: string,
    params?: BaseFilterParams & { productId?: string; warehouseId?: string },
  ): Promise<PaginatedResult<StockLedgerEntry>> {
    return stockLedgerRepository.listByOrganization(
      organizationId,
      {
        ...params,
        movementType: 'ADJUSTMENT',
      },
    );
  }
}

export const stockAdjustmentService = new StockAdjustmentService();
