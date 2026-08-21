import { PoolClient } from 'pg';
import {
  salesDeliveryRepository,
  SalesDeliveryFilterParams,
} from '../repositories/salesDelivery.repository';
import { salesOrderRepository } from '../repositories/salesOrder.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { productRepository } from '../repositories/product.repository';
import { inventoryService } from './inventory.service';
import { salesDeliveryStateMachineService } from './salesDeliveryStateMachine.service';
import {
  salesOrderStateMachineService,
  SalesOrderStatus,
} from './salesOrderStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  SalesDelivery,
  SalesDeliveryItem,
  CreateSalesDeliveryInput,
  CreateSalesDeliveryItemInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  SalesDeliveryNotFoundError,
  SalesDeliveryItemNotFoundError,
  SalesOrderNotFoundError,
  WarehouseNotFoundError,
  ProductNotFoundError,
  SalesOrderItemNotFoundError,
  OverDeliveryError,
  DuplicateDeliveryNumberError,
  ValidationError,
} from '../types';
import { compareDecimal, subtractDecimal } from '../utils/decimal';

export class SalesDeliveryService {
  /**
   * Generates a unique delivery number per organization if not provided.
   */
  private async generateDeliveryNumber(organizationId: string, tx?: PoolClient): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `DEL-${timestamp}${random}`;
    let existing = await salesDeliveryRepository.getDeliveryByNumber(organizationId, candidate, tx);
    let attempts = 0;
    while (existing && attempts < 5) {
      candidate = `DEL-${timestamp}${Math.floor(1000 + Math.random() * 9000)}`;
      existing = await salesDeliveryRepository.getDeliveryByNumber(organizationId, candidate, tx);
      attempts++;
    }
    return candidate;
  }

  /**
   * Creates a Sales Delivery header.
   */
  async createDelivery(
    data: CreateSalesDeliveryInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesDelivery> {
    return withTransaction(async (tx) => {
      // 1. Validate Sales Order existence and status
      const salesOrder = await salesOrderRepository.findById(data.organization_id, data.sales_order_id, tx);
      if (!salesOrder) {
        throw new SalesOrderNotFoundError(
          `Sales order with ID ${data.sales_order_id} not found in organization`,
        );
      }

      if (salesOrder.status !== 'confirmed' && salesOrder.status !== 'processing') {
        throw new ValidationError(
          `Sales order ${salesOrder.order_number} must be in 'confirmed' or 'processing' status to create a delivery (current: ${salesOrder.status})`,
        );
      }

      // 2. Validate Warehouse existence in organization
      const warehouse = await warehouseRepository.findById(data.organization_id, data.warehouse_id, tx);
      if (!warehouse) {
        throw new WarehouseNotFoundError(
          `Warehouse with ID ${data.warehouse_id} not found in organization`,
        );
      }

      // 3. Delivery Number handling
      let deliveryNumber = data.delivery_number?.trim();
      if (deliveryNumber) {
        const existingNum = await salesDeliveryRepository.getDeliveryByNumber(
          data.organization_id,
          deliveryNumber,
          tx,
        );
        if (existingNum) {
          throw new DuplicateDeliveryNumberError(
            `Delivery number '${deliveryNumber}' already exists in organization`,
          );
        }
      } else {
        deliveryNumber = await this.generateDeliveryNumber(data.organization_id, tx);
      }

      // 4. Create Delivery Header
      const delivery = await salesDeliveryRepository.createDelivery(
        {
          ...data,
          delivery_number: deliveryNumber,
          status: 'draft',
          created_by: userId,
        },
        tx,
      );

      // 5. Record Category A Audit Event
      await auditService.recordAuditEvent(
        {
          organization_id: data.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SALES_DELIVERY',
          entity_id: delivery.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'DELIVERY_CREATED',
            delivery_id: delivery.id,
            delivery_number: delivery.delivery_number,
            sales_order_id: salesOrder.id,
            order_number: salesOrder.order_number,
            warehouse_id: warehouse.id,
          },
        },
        tx,
      );

      return delivery;
    });
  }

  /**
   * Retrieves Sales Delivery with its items.
   */
  async getDelivery(
    organizationId: string,
    id: string,
  ): Promise<{ delivery: SalesDelivery; items: SalesDeliveryItem[] }> {
    const delivery = await salesDeliveryRepository.getDeliveryById(organizationId, id);
    if (!delivery) {
      throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${id} not found`);
    }

    const items = await salesDeliveryRepository.getDeliveryItems(organizationId, id);
    return { delivery, items };
  }

  /**
   * Lists Sales Deliveries with pagination & search.
   */
  async listDeliveries(
    organizationId: string,
    params?: SalesDeliveryFilterParams,
  ): Promise<PaginatedResult<SalesDelivery>> {
    return salesDeliveryRepository.listDeliveries(organizationId, params);
  }

  /**
   * Adds a line item to a draft Sales Delivery.
   */
  async addDeliveryItem(
    organizationId: string,
    deliveryId: string,
    data: Omit<CreateSalesDeliveryItemInput, 'organization_id' | 'delivery_id'>,
    userId?: string,
    requestId?: string,
  ): Promise<SalesDeliveryItem> {
    return withTransaction(async (tx) => {
      // 1. Lock Delivery Header FOR UPDATE
      const delivery = await salesDeliveryRepository.lockByIdForUpdate(organizationId, deliveryId, tx);
      if (!delivery) {
        throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${deliveryId} not found`);
      }

      if (delivery.status !== 'draft') {
        throw new ValidationError(
          `Items can only be added to deliveries in 'draft' status (current status: ${delivery.status})`,
        );
      }

      // 2. Validate Sales Order Item
      const soItem = await salesOrderRepository.findItemById(organizationId, data.sales_order_item_id, tx);
      if (!soItem || soItem.sales_order_id !== delivery.sales_order_id) {
        throw new SalesOrderItemNotFoundError(
          `Sales order item ${data.sales_order_item_id} does not belong to sales order ${delivery.sales_order_id}`,
        );
      }

      // 3. Validate Product
      const product = await productRepository.findById(organizationId, data.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${data.product_id} not found in organization`);
      }

      if (product.id !== soItem.product_id) {
        throw new ValidationError(
          `Product ${product.id} does not match sales order item product ${soItem.product_id}`,
        );
      }

      // 4. Over-delivery Protection & Remaining Deliverable Quantity Calculation
      const reqQtyStr = String(data.quantity);
      if (compareDecimal(reqQtyStr, 0) <= 0) {
        throw new ValidationError('Delivery quantity must be greater than zero');
      }

      const alreadyDelivered = await salesDeliveryRepository.getDeliveredQuantityForSalesOrderItem(
        organizationId,
        soItem.id,
        tx,
      );
      const orderedQty = String(soItem.quantity);
      const remainingQty = subtractDecimal(orderedQty, alreadyDelivered);

      if (compareDecimal(reqQtyStr, remainingQty) > 0) {
        throw new OverDeliveryError(
          soItem.id,
          reqQtyStr,
          remainingQty,
          `Requested delivery quantity ${reqQtyStr} exceeds remaining deliverable quantity ${remainingQty} for sales order item ${soItem.id}`,
        );
      }

      // 5. Create Delivery Item
      const newItem = await salesDeliveryRepository.createDeliveryItem(
        {
          organization_id: organizationId,
          delivery_id: deliveryId,
          sales_order_item_id: data.sales_order_item_id,
          product_id: data.product_id,
          quantity: reqQtyStr,
        },
        tx,
      );

      // 6. Record Category A Audit Event
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SALES_DELIVERY',
          entity_id: deliveryId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'DELIVERY_ITEM_ADDED',
            delivery_id: deliveryId,
            delivery_item_id: newItem.id,
            sales_order_item_id: soItem.id,
            product_id: product.id,
            quantity: reqQtyStr,
          },
        },
        tx,
      );

      return newItem;
    });
  }

  /**
   * Removes an item from a draft Sales Delivery.
   */
  async removeDeliveryItem(
    organizationId: string,
    deliveryId: string,
    itemId: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const delivery = await salesDeliveryRepository.lockByIdForUpdate(organizationId, deliveryId, tx);
      if (!delivery) {
        throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${deliveryId} not found`);
      }

      if (delivery.status !== 'draft') {
        throw new ValidationError(
          `Items can only be removed from deliveries in 'draft' status (current status: ${delivery.status})`,
        );
      }

      const item = await salesDeliveryRepository.getDeliveryItem(organizationId, itemId, tx);
      if (!item || item.delivery_id !== deliveryId) {
        throw new SalesDeliveryItemNotFoundError(`Delivery item with ID ${itemId} not found in delivery`);
      }

      const success = await salesDeliveryRepository.deleteDeliveryItem(organizationId, itemId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'SALES_DELIVERY',
          entity_id: deliveryId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'DELIVERY_ITEM_REMOVED',
            delivery_id: deliveryId,
            delivery_item_id: itemId,
          },
        },
        tx,
      );

      return success;
    });
  }

  // State Transition Delegates
  async confirmDelivery(organizationId: string, id: string, userId?: string, requestId?: string) {
    return salesDeliveryStateMachineService.transitionDelivery(organizationId, id, 'confirmed', userId, requestId);
  }

  async startPicking(organizationId: string, id: string, userId?: string, requestId?: string) {
    return salesDeliveryStateMachineService.transitionDelivery(organizationId, id, 'picking', userId, requestId);
  }

  async markPacked(organizationId: string, id: string, userId?: string, requestId?: string) {
    return salesDeliveryStateMachineService.transitionDelivery(organizationId, id, 'packed', userId, requestId);
  }

  /**
   * Ships a packed delivery: consumes stock, writes stock ledger entries, and updates delivery & sales order statuses.
   */
  async shipDelivery(
    organizationId: string,
    deliveryId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SalesDelivery> {
    return withTransaction(async (tx) => {
      // 1. Lock Delivery Header FOR UPDATE & verify state
      const delivery = await salesDeliveryRepository.lockByIdForUpdate(organizationId, deliveryId, tx);
      if (!delivery) {
        throw new SalesDeliveryNotFoundError(`Sales delivery with ID ${deliveryId} not found`);
      }

      if (delivery.status !== 'packed') {
        throw new ValidationError(
          `Sales delivery ${delivery.delivery_number} must be in 'packed' status to be shipped (current: ${delivery.status})`,
        );
      }

      // 2. Fetch delivery items
      const items = await salesDeliveryRepository.getDeliveryItems(organizationId, deliveryId, tx);
      if (!items || items.length === 0) {
        throw new ValidationError(
          `Sales delivery ${delivery.delivery_number} cannot be shipped without line items`,
        );
      }

      // 3. Process stock reduction & ledger entries for each item
      for (const item of items) {
        // Decrease physical inventory (which also records stock ledger entry)
        await inventoryService.decreaseStock(
          {
            organization_id: organizationId,
            product_id: item.product_id,
            warehouse_id: delivery.warehouse_id,
            quantity: item.quantity,
            reference_type: 'SALES_DELIVERY',
            reference_id: deliveryId,
            notes: `Shipped delivery ${delivery.delivery_number}`,
          },
          userId,
          requestId,
        );
      }

      // 4. Update delivery status to SHIPPED
      const shippedDelivery = await salesDeliveryStateMachineService.transitionDelivery(
        organizationId,
        deliveryId,
        'shipped',
        userId,
        requestId,
        { shipped_at: new Date() },
      );

      // 5. Check Sales Order delivery completeness & transition Sales Order status if needed
      const soItems = await salesOrderRepository.listItems(organizationId, delivery.sales_order_id, tx);
      let allDelivered = true;
      for (const soItem of soItems) {
        const deliveredQty = await salesDeliveryRepository.getDeliveredQuantityForSalesOrderItem(
          organizationId,
          soItem.id,
          tx,
        );
        if (compareDecimal(deliveredQty, soItem.quantity) < 0) {
          allDelivered = false;
          break;
        }
      }

      const salesOrder = await salesOrderRepository.findById(organizationId, delivery.sales_order_id, tx);
      if (salesOrder) {
        if (allDelivered && salesOrder.status !== 'shipped' && salesOrder.status !== 'completed') {
          // Transition Sales Order status to shipped/completed if in processing state
          if (salesOrder.status === 'confirmed') {
            await salesOrderStateMachineService.processSalesOrder(organizationId, salesOrder.id, userId, requestId);
          }
          if (
            salesOrderStateMachineService.canTransition(
              salesOrder.status as SalesOrderStatus,
              'shipped',
            )
          ) {
            await salesOrderStateMachineService.shipSalesOrder(organizationId, salesOrder.id, userId, requestId);
          }
        }
      }

      return shippedDelivery;
    });
  }

  async deliverDelivery(organizationId: string, id: string, userId?: string, requestId?: string) {
    return salesDeliveryStateMachineService.transitionDelivery(organizationId, id, 'delivered', userId, requestId, {
      delivered_at: new Date(),
    });
  }

  async cancelDelivery(organizationId: string, id: string, userId?: string, requestId?: string) {
    return salesDeliveryStateMachineService.transitionDelivery(organizationId, id, 'cancelled', userId, requestId, {
      cancelled_at: new Date(),
    });
  }

  async getSalesOrderDeliveries(organizationId: string, salesOrderId: string): Promise<SalesDelivery[]> {
    return salesDeliveryRepository.getDeliveriesBySalesOrder(organizationId, salesOrderId);
  }
}

export const salesDeliveryService = new SalesDeliveryService();
