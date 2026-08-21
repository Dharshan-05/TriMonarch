import { PoolClient } from 'pg';
import {
  purchaseOrderRepository,
  PurchaseOrderFilterParams,
} from '../repositories/purchaseOrder.repository';
import { supplierRepository } from '../repositories/supplier.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { productRepository } from '../repositories/product.repository';
import { purchaseOrderStateMachineService } from './purchaseOrderStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrderInput,
  CreatePurchaseOrderItemInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  PurchaseOrderNotFoundError,
  PurchaseOrderItemNotFoundError,
  SupplierNotFoundError,
  WarehouseNotFoundError,
  ProductNotFoundError,
  PurchaseOrderMissingItemsError,
  InvalidPurchaseOrderQuantityError,
  InvalidPurchaseOrderCostError,
  DuplicatePurchaseOrderNumberError,
  ValidationError,
} from '../types';
import {
  toDecimal,
  formatDecimal,
  compareDecimal,
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  MONEY_SCALE,
  QUANTITY_SCALE,
} from '../utils/decimal';

export interface CreatePurchaseOrderItemData {
  product_id: string;
  quantity: number | string;
  unit_cost: number | string;
  discount_amount?: number | string;
  tax_rate?: number | string;
}

export interface CreatePurchaseOrderServiceInput {
  organization_id: string;
  supplier_id: string;
  warehouse_id?: string | null;
  order_number?: string;
  order_date?: Date | string;
  expected_delivery_date?: Date | string | null;
  currency?: string;
  notes?: string | null;
  items: CreatePurchaseOrderItemData[];
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export class PurchaseOrderService {
  /**
   * Generates a unique purchase order number per organization.
   */
  private async generateOrderNumber(organizationId: string, tx?: PoolClient): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `PO-${timestamp}${random}`;

    let existing = await purchaseOrderRepository.findByOrderNumber(organizationId, candidate, tx);
    while (existing) {
      const nextRandom = Math.floor(1000 + Math.random() * 9000);
      candidate = `PO-${timestamp}${nextRandom}`;
      existing = await purchaseOrderRepository.findByOrderNumber(organizationId, candidate, tx);
    }
    return candidate;
  }

  /**
   * Recalculates and updates PO subtotal, tax_amount, discount_amount, and total_amount from items.
   */
  private async recalculateTotals(
    organizationId: string,
    purchaseOrderId: string,
    tx?: PoolClient,
  ): Promise<PurchaseOrder> {
    const items = await purchaseOrderRepository.listItems(organizationId, purchaseOrderId, tx);

    let subtotalDec = toDecimal(0);
    let taxDec = toDecimal(0);
    let discountDec = toDecimal(0);

    for (const item of items) {
      subtotalDec = toDecimal(
        addDecimal(subtotalDec, item.line_total, MONEY_SCALE),
      );
      taxDec = toDecimal(
        addDecimal(taxDec, item.tax_amount, MONEY_SCALE),
      );
      discountDec = toDecimal(
        addDecimal(discountDec, item.discount_amount, MONEY_SCALE),
      );
    }

    const totalDec = subtractDecimal(
      addDecimal(subtotalDec, taxDec, MONEY_SCALE),
      discountDec,
      MONEY_SCALE,
    );

    const updated = await purchaseOrderRepository.update(
      organizationId,
      purchaseOrderId,
      {
        subtotal: formatDecimal(subtotalDec, MONEY_SCALE),
        tax_amount: formatDecimal(taxDec, MONEY_SCALE),
        discount_amount: formatDecimal(discountDec, MONEY_SCALE),
        total_amount: formatDecimal(totalDec, MONEY_SCALE),
      },
      tx,
    );

    return updated!;
  }

  /**
   * Calculates item monetary totals safely using exact Decimal utilities.
   */
  private calculateItemTotals(
    quantityRaw: number | string,
    unitCostRaw: number | string,
    discountAmountRaw?: number | string,
    taxRateRaw?: number | string,
  ): {
    quantityStr: string;
    unitCostStr: string;
    discountAmountStr: string;
    taxRateStr: string;
    taxAmountStr: string;
    lineTotalStr: string;
  } {
    let qtyDec;
    try {
      qtyDec = toDecimal(quantityRaw);
    } catch {
      throw new InvalidPurchaseOrderQuantityError('Invalid item quantity format');
    }
    if (compareDecimal(qtyDec, 0) <= 0) {
      throw new InvalidPurchaseOrderQuantityError('Purchase order quantity must be greater than zero');
    }

    let costDec;
    try {
      costDec = toDecimal(unitCostRaw);
    } catch {
      throw new InvalidPurchaseOrderCostError('Invalid unit cost format');
    }
    if (compareDecimal(costDec, 0) < 0) {
      throw new InvalidPurchaseOrderCostError('Purchase order unit cost cannot be negative');
    }

    const discountDec = discountAmountRaw !== undefined ? toDecimal(discountAmountRaw) : toDecimal(0);
    if (compareDecimal(discountDec, 0) < 0) {
      throw new ValidationError('Discount amount cannot be negative');
    }

    const taxRateDec = taxRateRaw !== undefined ? toDecimal(taxRateRaw) : toDecimal(0);
    if (compareDecimal(taxRateDec, 0) < 0) {
      throw new ValidationError('Tax rate cannot be negative');
    }

    const qtyStr = formatDecimal(qtyDec, QUANTITY_SCALE);
    const costStr = formatDecimal(costDec, MONEY_SCALE);
    const discountStr = formatDecimal(discountDec, MONEY_SCALE);
    const taxRateStr = formatDecimal(taxRateDec, 6);

    const grossLine = multiplyDecimal(qtyStr, costStr, MONEY_SCALE);
    const afterDiscount = subtractDecimal(grossLine, discountStr, MONEY_SCALE);
    const taxAmountStr = multiplyDecimal(afterDiscount, taxRateStr, MONEY_SCALE);
    const lineTotalStr = addDecimal(afterDiscount, taxAmountStr, MONEY_SCALE);

    return {
      quantityStr: qtyStr,
      unitCostStr: costStr,
      discountAmountStr: discountStr,
      taxRateStr,
      taxAmountStr,
      lineTotalStr,
    };
  }

  /**
   * Creates a new Purchase Order with items transactional boundary.
   */
  async createPurchaseOrder(
    input: CreatePurchaseOrderServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrderWithItems> {
    return withTransaction(async (tx) => {
      // 1. Validate Supplier
      const supplier = await supplierRepository.findById(input.organization_id, input.supplier_id, tx);
      if (!supplier) {
        throw new SupplierNotFoundError(`Supplier with ID ${input.supplier_id} not found`);
      }

      // 2. Validate Warehouse if provided
      if (input.warehouse_id) {
        const warehouse = await warehouseRepository.findById(
          input.organization_id,
          input.warehouse_id,
          tx,
        );
        if (!warehouse) {
          throw new WarehouseNotFoundError(`Warehouse with ID ${input.warehouse_id} not found`);
        }
      }

      // 3. Require at least one item
      if (!input.items || input.items.length === 0) {
        throw new PurchaseOrderMissingItemsError(
          'Purchase order must contain at least one item upon creation',
        );
      }

      // 4. Validate order number or generate candidate
      let orderNumber = input.order_number?.trim();
      if (orderNumber) {
        const existing = await purchaseOrderRepository.findByOrderNumber(
          input.organization_id,
          orderNumber,
          tx,
        );
        if (existing) {
          throw new DuplicatePurchaseOrderNumberError(
            `Purchase order number '${orderNumber}' already exists in organization`,
          );
        }
      } else {
        orderNumber = await this.generateOrderNumber(input.organization_id, tx);
      }

      // 5. Validate each product & calculate line totals
      const processedItems: Array<{
        product_id: string;
        quantity: string;
        unit_cost: string;
        discount_amount: string;
        tax_rate: string;
        tax_amount: string;
        line_total: string;
        sequence: number;
      }> = [];

      let subtotalDec = toDecimal(0);
      let totalTaxDec = toDecimal(0);
      let totalDiscountDec = toDecimal(0);

      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i]!;

        const product = await productRepository.findById(
          input.organization_id,
          item.product_id,
          tx,
        );
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${item.product_id} not found`);
        }

        const totals = this.calculateItemTotals(
          item.quantity,
          item.unit_cost,
          item.discount_amount,
          item.tax_rate,
        );

        subtotalDec = toDecimal(
          addDecimal(subtotalDec, totals.lineTotalStr, MONEY_SCALE),
        );
        totalTaxDec = toDecimal(
          addDecimal(totalTaxDec, totals.taxAmountStr, MONEY_SCALE),
        );
        totalDiscountDec = toDecimal(
          addDecimal(totalDiscountDec, totals.discountAmountStr, MONEY_SCALE),
        );

        processedItems.push({
          product_id: item.product_id,
          quantity: totals.quantityStr,
          unit_cost: totals.unitCostStr,
          discount_amount: totals.discountAmountStr,
          tax_rate: totals.taxRateStr,
          tax_amount: totals.taxAmountStr,
          line_total: totals.lineTotalStr,
          sequence: i + 1,
        });
      }

      const totalDec = subtractDecimal(
        addDecimal(subtotalDec, totalTaxDec, MONEY_SCALE),
        totalDiscountDec,
        MONEY_SCALE,
      );

      // 6. Create Purchase Order header
      const createPoData: CreatePurchaseOrderInput = {
        organization_id: input.organization_id,
        supplier_id: input.supplier_id,
        warehouse_id: input.warehouse_id || null,
        order_number: orderNumber,
        order_date: input.order_date || new Date(),
        expected_delivery_date: input.expected_delivery_date || null,
        status: 'draft',
        currency: input.currency || 'USD',
        subtotal: formatDecimal(subtotalDec, MONEY_SCALE),
        tax_amount: formatDecimal(totalTaxDec, MONEY_SCALE),
        discount_amount: formatDecimal(totalDiscountDec, MONEY_SCALE),
        total_amount: formatDecimal(totalDec, MONEY_SCALE),
        notes: input.notes || null,
      };

      const po = await purchaseOrderRepository.create(createPoData, tx);

      // 7. Create Purchase Order line items
      const createdItems: PurchaseOrderItem[] = [];
      for (const pItem of processedItems) {
        const itemInput: CreatePurchaseOrderItemInput = {
          organization_id: input.organization_id,
          purchase_order_id: po.id,
          product_id: pItem.product_id,
          quantity: pItem.quantity,
          unit_cost: pItem.unit_cost,
          discount_amount: pItem.discount_amount,
          tax_rate: pItem.tax_rate,
          tax_amount: pItem.tax_amount,
          line_total: pItem.line_total,
          sequence: pItem.sequence,
        };
        const createdItem = await purchaseOrderRepository.createItem(itemInput, tx);
        createdItems.push(createdItem);
      }

      // 8. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: po.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_ORDER_CREATED',
            purchase_order_id: po.id,
            order_number: po.order_number,
            supplier_id: po.supplier_id,
            item_count: createdItems.length,
            total_amount: po.total_amount,
          },
        },
        tx,
      );

      return {
        ...po,
        items: createdItems,
      };
    });
  }

  /**
   * Retrieves Purchase Order details with line items.
   */
  async getPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderWithItems> {
    const po = await purchaseOrderRepository.findById(organizationId, purchaseOrderId);
    if (!po) {
      throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
    }

    const items = await purchaseOrderRepository.listItems(organizationId, purchaseOrderId);
    return {
      ...po,
      items,
    };
  }

  /**
   * Lists Purchase Orders with filters and pagination.
   */
  async listPurchaseOrders(
    organizationId: string,
    params?: PurchaseOrderFilterParams,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    return purchaseOrderRepository.search(organizationId, params || {});
  }

  /**
   * Updates Purchase Order header fields.
   */
  async updatePurchaseOrder(
    organizationId: string,
    id: string,
    data: Partial<CreatePurchaseOrderInput>,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return withTransaction(async (tx) => {
      const existing = await purchaseOrderRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${id} not found`);
      }

      if (data.status !== undefined) {
        throw new ValidationError(
          'Direct status modification is not permitted. Status transitions must be performed via PurchaseOrderStateMachineService.',
        );
      }

      if (data.supplier_id && data.supplier_id !== existing.supplier_id) {
        const supplier = await supplierRepository.findById(organizationId, data.supplier_id, tx);
        if (!supplier) {
          throw new SupplierNotFoundError(`Supplier with ID ${data.supplier_id} not found`);
        }
      }

      if (data.order_number && data.order_number.trim() !== existing.order_number) {
        const newOrderNum = data.order_number.trim();
        const duplicate = await purchaseOrderRepository.findByOrderNumber(organizationId, newOrderNum, tx);
        if (duplicate) {
          throw new DuplicatePurchaseOrderNumberError(
            `Purchase order number '${newOrderNum}' already exists in organization`,
          );
        }
      }

      const updated = (await purchaseOrderRepository.update(organizationId, id, data, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            order_number: updated.order_number,
            previous_status: existing.status,
            new_status: updated.status,
            total_amount: updated.total_amount,
          },
        },
        tx,
      );

      const { businessEventService } = await import('./businessEvent.service');
      await businessEventService.emit({
        eventName: 'PURCHASE_ORDER_UPDATED',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { purchase_order_id: id },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Deletes a Purchase Order.
   */
  async deletePurchaseOrder(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existing = await purchaseOrderRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${id} not found`);
      }

      const deleted = await purchaseOrderRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            order_number: existing.order_number,
            supplier_id: existing.supplier_id,
            total_amount: existing.total_amount,
          },
        },
        tx,
      );

      const { businessEventService } = await import('./businessEvent.service');
      await businessEventService.emit({
        eventName: 'PURCHASE_ORDER_DELETED',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { purchase_order_id: id },
        client: tx,
      });

      return deleted;
    });
  }

  /**
   * Adds an item to a draft Purchase Order.
   */
  async addItem(
    organizationId: string,
    purchaseOrderId: string,
    itemData: CreatePurchaseOrderItemData,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrderItem> {
    return withTransaction(async (tx) => {
      const po = await purchaseOrderRepository.lockByIdForUpdate(organizationId, purchaseOrderId, tx);
      if (!po) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
      }

      if (po.status !== 'draft') {
        throw new ValidationError('Items can only be added to purchase orders in draft status');
      }

      const product = await productRepository.findById(organizationId, itemData.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${itemData.product_id} not found`);
      }

      const totals = this.calculateItemTotals(
        itemData.quantity,
        itemData.unit_cost,
        itemData.discount_amount,
        itemData.tax_rate,
      );

      const existingItems = await purchaseOrderRepository.listItems(organizationId, purchaseOrderId, tx);
      const sequence = existingItems.length + 1;

      const newItem = await purchaseOrderRepository.createItem(
        {
          organization_id: organizationId,
          purchase_order_id: purchaseOrderId,
          product_id: itemData.product_id,
          quantity: totals.quantityStr,
          unit_cost: totals.unitCostStr,
          discount_amount: totals.discountAmountStr,
          tax_rate: totals.taxRateStr,
          tax_amount: totals.taxAmountStr,
          line_total: totals.lineTotalStr,
          sequence,
        },
        tx,
      );

      await this.recalculateTotals(organizationId, purchaseOrderId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: purchaseOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_ORDER_ITEM_ADDED',
            purchase_order_id: purchaseOrderId,
            item_id: newItem.id,
            product_id: newItem.product_id,
            quantity: newItem.quantity,
            line_total: newItem.line_total,
          },
        },
        tx,
      );

      return newItem;
    });
  }

  /**
   * Updates an item in a draft Purchase Order.
   */
  async updateItem(
    organizationId: string,
    purchaseOrderId: string,
    itemId: string,
    updateData: Partial<CreatePurchaseOrderItemData>,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrderItem> {
    return withTransaction(async (tx) => {
      const po = await purchaseOrderRepository.lockByIdForUpdate(organizationId, purchaseOrderId, tx);
      if (!po) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
      }

      if (po.status !== 'draft') {
        throw new ValidationError('Items can only be modified on purchase orders in draft status');
      }

      const existingItem = await purchaseOrderRepository.findItemById(organizationId, itemId, tx);
      if (!existingItem || existingItem.purchase_order_id !== purchaseOrderId) {
        throw new PurchaseOrderItemNotFoundError(`Purchase order item with ID ${itemId} not found`);
      }

      const productId = updateData.product_id || existingItem.product_id;
      if (updateData.product_id) {
        const product = await productRepository.findById(organizationId, productId, tx);
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${productId} not found`);
        }
      }

      const qtyRaw = updateData.quantity !== undefined ? updateData.quantity : existingItem.quantity;
      const costRaw = updateData.unit_cost !== undefined ? updateData.unit_cost : existingItem.unit_cost;
      const discountRaw =
        updateData.discount_amount !== undefined
          ? updateData.discount_amount
          : existingItem.discount_amount;
      const taxRateRaw =
        updateData.tax_rate !== undefined ? updateData.tax_rate : existingItem.tax_rate;

      const totals = this.calculateItemTotals(qtyRaw, costRaw, discountRaw, taxRateRaw);

      const updatedItem = (await purchaseOrderRepository.updateItem(
        organizationId,
        itemId,
        {
          product_id: productId,
          quantity: totals.quantityStr,
          unit_cost: totals.unitCostStr,
          discount_amount: totals.discountAmountStr,
          tax_rate: totals.taxRateStr,
          tax_amount: totals.taxAmountStr,
          line_total: totals.lineTotalStr,
        },
        tx,
      ))!;

      await this.recalculateTotals(organizationId, purchaseOrderId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: purchaseOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_ORDER_ITEM_UPDATED',
            purchase_order_id: purchaseOrderId,
            item_id: itemId,
            line_total: updatedItem.line_total,
          },
        },
        tx,
      );

      return updatedItem;
    });
  }

  /**
   * Removes an item from a draft Purchase Order.
   */
  async removeItem(
    organizationId: string,
    purchaseOrderId: string,
    itemId: string,
    userId?: string,
    requestId?: string,
  ): Promise<void> {
    return withTransaction(async (tx) => {
      const po = await purchaseOrderRepository.lockByIdForUpdate(organizationId, purchaseOrderId, tx);
      if (!po) {
        throw new PurchaseOrderNotFoundError(`Purchase order with ID ${purchaseOrderId} not found`);
      }

      if (po.status !== 'draft') {
        throw new ValidationError('Items can only be removed from purchase orders in draft status');
      }

      const existingItem = await purchaseOrderRepository.findItemById(organizationId, itemId, tx);
      if (!existingItem || existingItem.purchase_order_id !== purchaseOrderId) {
        throw new PurchaseOrderItemNotFoundError(`Purchase order item with ID ${itemId} not found`);
      }

      await purchaseOrderRepository.deleteItem(organizationId, itemId, tx);

      await this.recalculateTotals(organizationId, purchaseOrderId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_ORDER',
          entity_id: purchaseOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_ORDER_ITEM_REMOVED',
            purchase_order_id: purchaseOrderId,
            item_id: itemId,
          },
        },
        tx,
      );
    });
  }

  /**
   * Submits a draft Purchase Order.
   */
  async submitPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    const items = await purchaseOrderRepository.listItems(organizationId, purchaseOrderId);
    if (!items || items.length === 0) {
      throw new PurchaseOrderMissingItemsError(
        'Purchase order must contain at least one item before submission',
      );
    }
    return purchaseOrderStateMachineService.submitPurchaseOrder(
      organizationId,
      purchaseOrderId,
      userId,
      requestId,
    );
  }

  /**
   * Approves a submitted Purchase Order.
   * NOTE: Stock is NOT modified upon Purchase Order approval.
   */
  async approvePurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return purchaseOrderStateMachineService.approvePurchaseOrder(
      organizationId,
      purchaseOrderId,
      userId,
      requestId,
    );
  }

  /**
   * Marks a Purchase Order as partially received.
   */
  async markPartiallyReceived(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return purchaseOrderStateMachineService.markPartiallyReceived(
      organizationId,
      purchaseOrderId,
      userId,
      requestId,
    );
  }

  /**
   * Marks a Purchase Order as fully received.
   */
  async markReceived(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return purchaseOrderStateMachineService.markReceived(
      organizationId,
      purchaseOrderId,
      userId,
      requestId,
    );
  }

  /**
   * Cancels a Purchase Order.
   */
  async cancelPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseOrder> {
    return purchaseOrderStateMachineService.cancelPurchaseOrder(
      organizationId,
      purchaseOrderId,
      userId,
      requestId,
    );
  }
}

export const purchaseOrderService = new PurchaseOrderService();
