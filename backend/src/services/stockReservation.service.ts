import { stockReservationRepository, StockReservationFilterParams } from '../repositories/stockReservation.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { productRepository } from '../repositories/product.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { stockLedgerRepository } from '../repositories/stockLedger.repository';
import {
  StockReservation,
  CreateStockReservationInput,
  StockReservationStatus,
} from '../types/database';
import {
  ValidationError,
  InsufficientAvailableStockError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  ReservationNotFoundError,
  InvalidReservationQuantityError,
  InvalidReservationStateTransitionError,
  ReservationExpiredError,
  ReservationAlreadyConsumedError,
  ReservationAlreadyReleasedError,
} from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  toDecimal,
  formatDecimal,
  subtractDecimal,
  compareDecimal,
  QUANTITY_SCALE,
} from '../utils/decimal';
import { createStockReservationSchema } from '../schemas/stockReservation.schema';

export class StockReservationService {
  async getReservationById(organizationId: string, id: string): Promise<StockReservation> {
    const res = await stockReservationRepository.findById(organizationId, id);
    if (!res) {
      throw new ReservationNotFoundError(`Stock reservation with ID ${id} not found`);
    }
    return res;
  }

  async getAvailableQuantity(
    organizationId: string,
    productId: string,
    warehouseId: string,
  ): Promise<string> {
    const inv = await inventoryRepository.findByProductAndWarehouse(organizationId, productId, warehouseId);
    const onHandStr = inv ? formatDecimal(inv.quantity, QUANTITY_SCALE) : '0.0000';
    const reservedStr = await stockReservationRepository.getSumActiveQuantity(
      organizationId,
      productId,
      warehouseId,
    );
    const availableDecimal = subtractDecimal(onHandStr, reservedStr, QUANTITY_SCALE);
    return compareDecimal(availableDecimal, 0) < 0 ? '0.0000' : availableDecimal;
  }

  async reserveStock(
    data: CreateStockReservationInput,
    userId?: string,
    requestId?: string,
  ): Promise<StockReservation> {
    const parseResult = createStockReservationSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid stock reservation payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    let qtyDecimal;
    try {
      qtyDecimal = toDecimal(validated.quantity);
    } catch {
      throw new InvalidReservationQuantityError('Invalid reservation quantity format');
    }

    if (compareDecimal(qtyDecimal, 0) <= 0) {
      throw new InvalidReservationQuantityError('Reservation quantity must be greater than zero');
    }

    const qtyStr = formatDecimal(qtyDecimal, QUANTITY_SCALE);

    return withTransaction(async (tx) => {
      const product = await productRepository.findById(organizationId, validated.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${validated.product_id} not found`);
      }

      const warehouse = await warehouseRepository.findById(organizationId, validated.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${validated.warehouse_id} not found`);
      }

      // Lock inventory row FOR UPDATE
      const inv = await inventoryRepository.ensureInventoryRowLocked(
        organizationId,
        validated.product_id,
        validated.warehouse_id,
        '0.0000',
        tx,
      );

      const onHandStr = formatDecimal(inv.quantity, QUANTITY_SCALE);
      const reservedStr = await stockReservationRepository.getSumActiveQuantity(
        organizationId,
        validated.product_id,
        validated.warehouse_id,
        tx,
      );

      const availableStr = subtractDecimal(onHandStr, reservedStr, QUANTITY_SCALE);

      if (compareDecimal(qtyStr, availableStr) > 0) {
        throw new InsufficientAvailableStockError(
          `Requested reservation quantity ${qtyStr} exceeds available stock ${availableStr} (on-hand: ${onHandStr}, reserved: ${reservedStr})`,
        );
      }

      const reservation = await stockReservationRepository.create(
        {
          ...validated,
          organization_id: organizationId,
          quantity: qtyStr,
          status: 'active',
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'INVENTORY',
          entity_id: reservation.id,
          request_id: requestId,
          success: true,
          metadata: {
            reservation_id: reservation.id,
            product_id: validated.product_id,
            warehouse_id: validated.warehouse_id,
            quantity: qtyStr,
            available_before: availableStr,
            status: 'active',
            reference_type: validated.reference_type,
            reference_id: validated.reference_id,
          },
        },
        tx,
      );

      return reservation;
    });
  }

  async releaseReservation(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<StockReservation> {
    return withTransaction(async (tx) => {
      const res = await stockReservationRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!res) {
        throw new ReservationNotFoundError(`Stock reservation with ID ${id} not found`);
      }

      this.validateStateTransition(res.status, 'released');

      const updated = (await stockReservationRepository.update(organizationId, id, { status: 'released' }, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            reservation_id: id,
            previous_status: res.status,
            new_status: 'released',
            quantity: res.quantity,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async consumeReservation(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<StockReservation> {
    return withTransaction(async (tx) => {
      const res = await stockReservationRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!res) {
        throw new ReservationNotFoundError(`Stock reservation with ID ${id} not found`);
      }

      this.validateStateTransition(res.status, 'consumed');

      if (res.expires_at && new Date(res.expires_at) <= new Date()) {
        throw new ReservationExpiredError(`Stock reservation ${id} has expired`);
      }

      // Lock Inventory Row FOR UPDATE
      const inv = await inventoryRepository.ensureInventoryRowLocked(
        organizationId,
        res.product_id,
        res.warehouse_id,
        '0.0000',
        tx,
      );

      const prevQty = formatDecimal(inv.quantity, QUANTITY_SCALE);
      const consumeQtyStr = formatDecimal(res.quantity, QUANTITY_SCALE);
      const newQtyStr = subtractDecimal(prevQty, consumeQtyStr, QUANTITY_SCALE);

      if (compareDecimal(newQtyStr, 0) < 0) {
        throw new ValidationError('Reservation consumption results in negative stock balance');
      }

      await inventoryRepository.updateQuantity(organizationId, inv.id, newQtyStr, tx);

      await stockLedgerRepository.create(
        {
          organization_id: organizationId,
          product_id: res.product_id,
          warehouse_id: res.warehouse_id,
          movement_type: 'OUT',
          quantity: '-' + consumeQtyStr,
          reference_type: res.reference_type || 'reservation',
          reference_id: res.id,
          notes: `Consumed reservation ${res.id}`,
        },
        tx,
      );

      const updated = (await stockReservationRepository.update(organizationId, id, { status: 'consumed' }, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            reservation_id: id,
            previous_status: res.status,
            new_status: 'consumed',
            quantity: consumeQtyStr,
            inventory_before: prevQty,
            inventory_after: newQtyStr,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async cancelReservation(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<StockReservation> {
    return withTransaction(async (tx) => {
      const res = await stockReservationRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!res) {
        throw new ReservationNotFoundError(`Stock reservation with ID ${id} not found`);
      }

      this.validateStateTransition(res.status, 'cancelled');

      const updated = (await stockReservationRepository.update(organizationId, id, { status: 'cancelled' }, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            reservation_id: id,
            previous_status: res.status,
            new_status: 'cancelled',
            quantity: res.quantity,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async expireReservation(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<StockReservation> {
    return withTransaction(async (tx) => {
      const res = await stockReservationRepository.lockByIdForUpdate(organizationId, id, tx);
      if (!res) {
        throw new ReservationNotFoundError(`Stock reservation with ID ${id} not found`);
      }

      this.validateStateTransition(res.status, 'expired');

      const updated = (await stockReservationRepository.update(organizationId, id, { status: 'expired' }, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            reservation_id: id,
            previous_status: res.status,
            new_status: 'expired',
            quantity: res.quantity,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async listReservations(
    organizationId: string,
    params?: StockReservationFilterParams & PaginationParams,
  ): Promise<PaginatedResult<StockReservation>> {
    return stockReservationRepository.listByOrganization(organizationId, params || {});
  }

  async listActiveReservations(
    organizationId: string,
    productId: string,
    warehouseId: string,
  ): Promise<StockReservation[]> {
    return stockReservationRepository.listActiveByProductAndWarehouse(organizationId, productId, warehouseId);
  }

  private validateStateTransition(current: StockReservationStatus, target: StockReservationStatus): void {
    if (current === target) {
      if (current === 'consumed') throw new ReservationAlreadyConsumedError();
      if (current === 'released') throw new ReservationAlreadyReleasedError();
      throw new InvalidReservationStateTransitionError(`Reservation is already in state ${current}`);
    }

    if (current !== 'active') {
      if (current === 'consumed') throw new ReservationAlreadyConsumedError();
      if (current === 'released') throw new ReservationAlreadyReleasedError();
      throw new InvalidReservationStateTransitionError(
        `Cannot transition reservation from terminal state ${current} to ${target}`,
      );
    }
  }
}

export const stockReservationService = new StockReservationService();
