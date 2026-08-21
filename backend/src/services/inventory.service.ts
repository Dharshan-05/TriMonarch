import { PoolClient } from 'pg';
import { inventoryRepository } from '../repositories/inventory.repository';
import { productRepository } from '../repositories/product.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { stockLedgerRepository } from '../repositories/stockLedger.repository';
import { Inventory, CreateInventoryInput, StockLedgerEntry } from '../types/database';
import {
  InsufficientStockError,
  NegativeStockError,
  InventoryNotFoundError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  InvalidInventoryQuantityError,
} from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { businessEventService } from './businessEvent.service';
import {
  toDecimal,
  formatDecimal,
  addDecimal,
  subtractDecimal,
  compareDecimal,
  QUANTITY_SCALE,
} from '../utils/decimal';

export interface IncreaseStockInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export interface DecreaseStockInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export interface AdjustStockInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  target_quantity?: string | number;
  delta_quantity?: string | number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export class InventoryService {
  async createInventory(
    data: CreateInventoryInput,
    userId?: string,
    requestId?: string,
  ): Promise<Inventory> {
    return withTransaction(async (tx) => {
      const product = await productRepository.findById(data.organization_id, data.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${data.product_id} not found`);
      }

      const warehouse = await warehouseRepository.findById(data.organization_id, data.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${data.warehouse_id} not found`);
      }

      const inv = await inventoryRepository.create(data, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: data.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'INVENTORY',
          entity_id: inv.id,
          request_id: requestId,
          success: true,
          metadata: { product_id: inv.product_id, warehouse_id: inv.warehouse_id, quantity: inv.quantity },
        },
        tx,
      );

      await businessEventService.emit({
        eventName: 'INVENTORY_CREATED',
        organization_id: data.organization_id,
        user_id: userId,
        request_id: requestId,
        metadata: { inventory_id: inv.id, product_id: inv.product_id, warehouse_id: inv.warehouse_id },
        client: tx,
      });

      return inv;
    });
  }

  async getInventoryById(organizationId: string, id: string): Promise<Inventory> {
    const inv = await inventoryRepository.findById(organizationId, id);
    if (!inv) {
      throw new InventoryNotFoundError(`Inventory item with ID ${id} not found`);
    }
    return inv;
  }

  async getInventory(
    organizationId: string,
    productId: string,
    warehouseId: string,
  ): Promise<Inventory | null> {
    const product = await productRepository.findById(organizationId, productId);
    if (!product) {
      throw new ProductNotFoundError(`Product with ID ${productId} not found`);
    }

    const warehouse = await warehouseRepository.findById(organizationId, warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(`Warehouse with ID ${warehouseId} not found`);
    }

    return inventoryRepository.findByProductAndWarehouse(organizationId, productId, warehouseId);
  }

  async getAvailableQuantity(
    organizationId: string,
    productId: string,
    warehouseId: string,
  ): Promise<string> {
    const inv = await this.getInventory(organizationId, productId, warehouseId);
    if (!inv) {
      return formatDecimal('0.0000', QUANTITY_SCALE);
    }
    return formatDecimal(inv.quantity, QUANTITY_SCALE);
  }

  async listInventoryByOrganization(
    organizationId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Inventory>> {
    return inventoryRepository.listByOrganization(organizationId, params || {});
  }

  async increaseStock(
    input: IncreaseStockInput,
    userId?: string,
    requestId?: string,
    client?: PoolClient,
  ): Promise<Inventory> {
    let qtyDecimal;
    try {
      qtyDecimal = toDecimal(input.quantity);
    } catch {
      throw new InvalidInventoryQuantityError('Invalid inventory quantity format');
    }

    if (compareDecimal(qtyDecimal, 0) <= 0) {
      throw new InvalidInventoryQuantityError('Stock increase quantity must be greater than zero');
    }

    const qtyStr = formatDecimal(qtyDecimal, QUANTITY_SCALE);

    const execute = async (tx: PoolClient) => {
      const product = await productRepository.findById(input.organization_id, input.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${input.product_id} not found`);
      }

      const warehouse = await warehouseRepository.findById(input.organization_id, input.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${input.warehouse_id} not found`);
      }

      let inv = await inventoryRepository.ensureInventoryRowLocked(
        input.organization_id,
        input.product_id,
        input.warehouse_id,
        '0.0000',
        tx,
      );

      const previousQuantity = formatDecimal(inv.quantity, QUANTITY_SCALE);
      const newQuantity = addDecimal(inv.quantity, qtyStr, QUANTITY_SCALE);
      inv = (await inventoryRepository.updateQuantity(input.organization_id, inv.id, newQuantity, tx))!;

      await stockLedgerRepository.create(
        {
          organization_id: input.organization_id,
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          movement_type: 'IN',
          quantity: qtyStr,
          reference_type: input.reference_type || null,
          reference_id: input.reference_id || null,
          notes: input.notes || null,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'INVENTORY',
          entity_id: inv.id,
          request_id: requestId,
          success: true,
          metadata: {
            movement_type: 'IN',
            product_id: input.product_id,
            warehouse_id: input.warehouse_id,
            quantity_delta: qtyStr,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reference_type: input.reference_type,
            reference_id: input.reference_id,
          },
        },
        tx,
      );

      return inv;
    };

    if (client) {
      return execute(client);
    }
    return withTransaction(execute);
  }

  async decreaseStock(
    input: DecreaseStockInput,
    userId?: string,
    requestId?: string,
    client?: PoolClient,
  ): Promise<Inventory> {
    let qtyDecimal;
    try {
      qtyDecimal = toDecimal(input.quantity);
    } catch {
      throw new InvalidInventoryQuantityError('Invalid inventory quantity format');
    }

    if (compareDecimal(qtyDecimal, 0) <= 0) {
      throw new InvalidInventoryQuantityError('Stock decrease quantity must be greater than zero');
    }

    const qtyStr = formatDecimal(qtyDecimal, QUANTITY_SCALE);

    const execute = async (tx: PoolClient) => {
      const product = await productRepository.findById(input.organization_id, input.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${input.product_id} not found`);
      }

      const warehouse = await warehouseRepository.findById(input.organization_id, input.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${input.warehouse_id} not found`);
      }

      let inv = await inventoryRepository.lockForUpdate(
        input.organization_id,
        input.product_id,
        input.warehouse_id,
        tx,
      );

      if (!inv || compareDecimal(inv.quantity, qtyStr) < 0) {
        throw new InsufficientStockError(
          `Insufficient stock for product ${input.product_id} in warehouse ${input.warehouse_id}`,
        );
      }

      const previousQuantity = formatDecimal(inv.quantity, QUANTITY_SCALE);
      const newQuantity = subtractDecimal(inv.quantity, qtyStr, QUANTITY_SCALE);

      if (compareDecimal(newQuantity, 0) < 0) {
        throw new NegativeStockError('Stock operation would result in negative inventory balance');
      }

      inv = (await inventoryRepository.updateQuantity(input.organization_id, inv.id, newQuantity, tx))!;

      await stockLedgerRepository.create(
        {
          organization_id: input.organization_id,
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          movement_type: 'OUT',
          quantity: '-' + qtyStr,
          reference_type: input.reference_type || null,
          reference_id: input.reference_id || null,
          notes: input.notes || null,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'INVENTORY',
          entity_id: inv.id,
          request_id: requestId,
          success: true,
          metadata: {
            movement_type: 'OUT',
            product_id: input.product_id,
            warehouse_id: input.warehouse_id,
            quantity_delta: '-' + qtyStr,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reference_type: input.reference_type,
            reference_id: input.reference_id,
          },
        },
        tx,
      );

      return inv;
    };

    if (client) {
      return execute(client);
    }
    return withTransaction(execute);
  }

  async adjustStock(
    input: AdjustStockInput,
    userId?: string,
    requestId?: string,
  ): Promise<Inventory> {
    const { stockAdjustmentService } = await import('./stockAdjustment.service');
    const res = await stockAdjustmentService.adjustStock(input, userId, requestId);

    await businessEventService.emit({
      eventName: 'INVENTORY_ADJUSTED',
      organization_id: input.organization_id,
      user_id: userId,
      request_id: requestId,
      metadata: { product_id: input.product_id, warehouse_id: input.warehouse_id },
    });

    return res.inventory;
  }

  async adjustStockById(
    organizationId: string,
    id: string,
    data: { target_quantity?: string | number; delta_quantity?: string | number; quantity?: string | number; reason?: string },
    userId?: string,
    requestId?: string,
  ): Promise<Inventory> {
    const inv = await this.getInventoryById(organizationId, id);
    const adjustInput: AdjustStockInput = {
      organization_id: organizationId,
      product_id: inv.product_id,
      warehouse_id: inv.warehouse_id,
      target_quantity: data.target_quantity ?? data.quantity,
      delta_quantity: data.delta_quantity,
      notes: data.reason,
    };
    return this.adjustStock(adjustInput, userId, requestId);
  }

  async updateInventory(
    organizationId: string,
    id: string,
    data: { quantity?: string | number; reorder_level?: string | number },
    userId?: string,
    requestId?: string,
  ): Promise<Inventory> {
    await this.getInventoryById(organizationId, id);
    const updated = await inventoryRepository.update(organizationId, id, data);

    await businessEventService.emit({
      eventName: 'INVENTORY_UPDATED',
      organization_id: organizationId,
      user_id: userId,
      request_id: requestId,
      metadata: { inventory_id: id },
    });

    return updated!;
  }

  async deleteInventory(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const inv = await inventoryRepository.findById(organizationId, id, tx);
      if (!inv) {
        throw new InventoryNotFoundError(`Inventory item with ID ${id} not found`);
      }

      const deleted = await inventoryRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'INVENTORY',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: { deleted: { product_id: inv.product_id, warehouse_id: inv.warehouse_id } },
        },
        tx,
      );

      await businessEventService.emit({
        eventName: 'INVENTORY_DELETED',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { inventory_id: id },
        client: tx,
      });

      return deleted;
    });
  }

  async getMovements(
    organizationId: string,
    inventoryId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<StockLedgerEntry>> {
    const inv = await this.getInventoryById(organizationId, inventoryId);
    return stockLedgerRepository.listByProductAndWarehouse(organizationId, inv.product_id, inv.warehouse_id, params);
  }
}

export const inventoryService = new InventoryService();
