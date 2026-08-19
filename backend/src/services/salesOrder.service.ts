import { salesOrderRepository, SalesOrderFilterParams } from '../repositories/salesOrder.repository';
import { productRepository } from '../repositories/product.repository';
import { customerRepository } from '../repositories/customer.repository';
import {
  SalesOrder,
  SalesOrderItem,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  CreateSalesOrderItemInput,
  UpdateSalesOrderItemInput,
} from '../types/database';
import {
  ValidationError,
  CustomerNotFoundError,
  ProductNotFoundError,
  SalesOrderNotFoundError,
  SalesOrderItemNotFoundError,
  DuplicateOrderNumberError,
} from '../types';
import { PaginatedResult } from '../repositories/base';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  toDecimal,
  formatDecimal,
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideDecimal,
  compareDecimal,
  MONEY_SCALE,
  QUANTITY_SCALE,
  RATE_SCALE,
} from '../utils/decimal';
import {
  createSalesOrderSchema,
  createSalesOrderWithItemsSchema,
  updateSalesOrderSchema,
  createSalesOrderItemSchema,
  updateSalesOrderItemSchema,
} from '../schemas/salesOrder.schema';

export interface CreateSalesOrderWithItemsInput extends CreateSalesOrderInput {
  items: Array<Omit<CreateSalesOrderItemInput, 'organization_id' | 'sales_order_id'>>;
}

export interface SalesOrderWithItemsResult {
  order: SalesOrder;
  items: SalesOrderItem[];
}

export interface CalculatedItemValues {
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  discounted_line: string;
}

export interface CalculatedOrderTotals {
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
}

export class SalesOrderService {
  /**
   * Calculates line item financial totals using exact decimal arithmetic.
   * gross_line = quantity * unit_price
   * discounted_line = gross_line - discount_amount
   * tax_amount = discounted_line * (tax_rate / 100)
   * line_total = discounted_line + tax_amount
   */
  public calculateItemTotals(
    quantity: string | number,
    unitPrice: string | number,
    discountAmount: string | number = '0.0000',
    taxRate: string | number = '0.000000',
  ): CalculatedItemValues {
    const qtyStr = formatDecimal(quantity, QUANTITY_SCALE);
    const priceStr = formatDecimal(unitPrice, MONEY_SCALE);
    const discountStr = formatDecimal(discountAmount, MONEY_SCALE);
    const rateStr = formatDecimal(taxRate, RATE_SCALE);

    const grossLineStr = multiplyDecimal(qtyStr, priceStr, MONEY_SCALE);

    let discountedLineStr = subtractDecimal(grossLineStr, discountStr, MONEY_SCALE);
    if (compareDecimal(discountedLineStr, 0) < 0) {
      discountedLineStr = '0.0000';
    }

    const rateFracStr = divideDecimal(rateStr, '100.000000', RATE_SCALE);
    const taxAmountStr = multiplyDecimal(discountedLineStr, rateFracStr, MONEY_SCALE);
    const lineTotalStr = addDecimal(discountedLineStr, taxAmountStr, MONEY_SCALE);

    return {
      quantity: qtyStr,
      unit_price: priceStr,
      discount_amount: discountStr,
      tax_rate: rateStr,
      tax_amount: taxAmountStr,
      line_total: lineTotalStr,
      discounted_line: discountedLineStr,
    };
  }

  /**
   * Recalculates total header figures from line items using exact decimal arithmetic.
   * subtotal = sum of discounted line values
   * tax_amount = sum of line tax amounts
   * discount_amount = sum of line discounts
   * total_amount = subtotal + tax_amount
   */
  public calculateOrderTotals(items: SalesOrderItem[]): CalculatedOrderTotals {
    let subtotalDec = toDecimal(0);
    let taxAmountDec = toDecimal(0);
    let discountAmountDec = toDecimal(0);

    for (const item of items) {
      const computed = this.calculateItemTotals(
        item.quantity,
        item.unit_price,
        item.discount_amount,
        item.tax_rate,
      );

      subtotalDec = subtotalDec.plus(toDecimal(computed.discounted_line));
      taxAmountDec = taxAmountDec.plus(toDecimal(computed.tax_amount));
      discountAmountDec = discountAmountDec.plus(toDecimal(computed.discount_amount));
    }

    const subtotalStr = formatDecimal(subtotalDec, MONEY_SCALE);
    const taxAmountStr = formatDecimal(taxAmountDec, MONEY_SCALE);
    const discountAmountStr = formatDecimal(discountAmountDec, MONEY_SCALE);
    const totalAmountStr = addDecimal(subtotalStr, taxAmountStr, MONEY_SCALE);

    return {
      subtotal: subtotalStr,
      tax_amount: taxAmountStr,
      discount_amount: discountAmountStr,
      total_amount: totalAmountStr,
    };
  }

  async getSalesOrderById(organizationId: string, id: string): Promise<SalesOrder> {
    const order = await salesOrderRepository.findById(organizationId, id);
    if (!order) {
      throw new SalesOrderNotFoundError(`Sales order with ID ${id} not found`);
    }
    return order;
  }

  async getSalesOrderByOrderNumber(organizationId: string, orderNumber: string): Promise<SalesOrder> {
    const order = await salesOrderRepository.findByOrderNumber(organizationId, orderNumber.trim());
    if (!order) {
      throw new SalesOrderNotFoundError(`Sales order with order number '${orderNumber}' not found`);
    }
    return order;
  }

  async createSalesOrder(
    data: CreateSalesOrderInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    const parseResult = createSalesOrderSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid sales order payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    const orderNumber = validated.order_number.trim();

    return withTransaction(async (tx) => {
      const customer = await customerRepository.findById(organizationId, validated.customer_id, tx);
      if (!customer) {
        throw new CustomerNotFoundError(`Customer with ID ${validated.customer_id} not found`);
      }

      const existingOrder = await salesOrderRepository.findByOrderNumber(organizationId, orderNumber, tx);
      if (existingOrder) {
        throw new DuplicateOrderNumberError(`Sales order number '${orderNumber}' already exists in organization`);
      }

      const order = await salesOrderRepository.create(
        {
          ...validated,
          organization_id: organizationId,
          order_number: orderNumber,
          notes: validated.notes ? validated.notes.trim() : null,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SALES_ORDER',
          entity_id: order.id,
          request_id: requestId,
          success: true,
          metadata: {
            order_number: order.order_number,
            customer_id: order.customer_id,
            status: order.status,
            total_amount: order.total_amount,
          },
        },
        tx,
      );

      return order;
    });
  }

  async createSalesOrderWithItems(
    data: CreateSalesOrderWithItemsInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrderWithItemsResult> {
    const parseResult = createSalesOrderWithItemsSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid sales order with items payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    const orderNumber = validated.order_number.trim();

    return withTransaction(async (tx) => {
      const customer = await customerRepository.findById(organizationId, validated.customer_id, tx);
      if (!customer) {
        throw new CustomerNotFoundError(`Customer with ID ${validated.customer_id} not found`);
      }

      const existingOrder = await salesOrderRepository.findByOrderNumber(organizationId, orderNumber, tx);
      if (existingOrder) {
        throw new DuplicateOrderNumberError(`Sales order number '${orderNumber}' already exists in organization`);
      }

      // Verify all products belong to the organization
      const processedItems: Array<CreateSalesOrderItemInput & CalculatedItemValues> = [];
      let subtotalDec = toDecimal(0);
      let taxAmountDec = toDecimal(0);
      let discountAmountDec = toDecimal(0);

      for (let i = 0; i < validated.items.length; i++) {
        const itemInput = validated.items[i]!;
        const product = await productRepository.findById(organizationId, itemInput.product_id, tx);
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${itemInput.product_id} not found`);
        }

        const computed = this.calculateItemTotals(
          itemInput.quantity,
          itemInput.unit_price,
          itemInput.discount_amount,
          itemInput.tax_rate,
        );

        subtotalDec = subtotalDec.plus(toDecimal(computed.discounted_line));
        taxAmountDec = taxAmountDec.plus(toDecimal(computed.tax_amount));
        discountAmountDec = discountAmountDec.plus(toDecimal(computed.discount_amount));

        processedItems.push({
          organization_id: organizationId,
          sales_order_id: '', // set after header creation
          product_id: itemInput.product_id,
          quantity: computed.quantity,
          unit_price: computed.unit_price,
          discount_amount: computed.discount_amount,
          tax_rate: computed.tax_rate,
          tax_amount: computed.tax_amount,
          line_total: computed.line_total,
          discounted_line: computed.discounted_line,
          sequence: itemInput.sequence || i + 1,
        });
      }

      const subtotalStr = formatDecimal(subtotalDec, MONEY_SCALE);
      const taxAmountStr = formatDecimal(taxAmountDec, MONEY_SCALE);
      const discountAmountStr = formatDecimal(discountAmountDec, MONEY_SCALE);
      const totalAmountStr = addDecimal(subtotalStr, taxAmountStr, MONEY_SCALE);

      const order = await salesOrderRepository.create(
        {
          ...validated,
          organization_id: organizationId,
          order_number: orderNumber,
          subtotal: subtotalStr,
          tax_amount: taxAmountStr,
          discount_amount: discountAmountStr,
          total_amount: totalAmountStr,
          notes: validated.notes ? validated.notes.trim() : null,
        },
        tx,
      );

      const items: SalesOrderItem[] = [];
      for (const itemData of processedItems) {
        const createdItem = await salesOrderRepository.createItem(
          {
            ...itemData,
            organization_id: organizationId,
            sales_order_id: order.id,
          },
          tx,
        );
        items.push(createdItem);
      }

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SALES_ORDER',
          entity_id: order.id,
          request_id: requestId,
          success: true,
          metadata: {
            order_number: order.order_number,
            customer_id: order.customer_id,
            item_count: items.length,
            total_amount: order.total_amount,
          },
        },
        tx,
      );

      return { order, items };
    });
  }

  async updateSalesOrder(
    organizationId: string,
    id: string,
    data: UpdateSalesOrderInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrder> {
    const parseResult = updateSalesOrderSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid sales order update payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    if (validated.status !== undefined) {
      throw new ValidationError(
        'Direct status modification is not permitted. Status transitions must be performed via SalesOrderStateMachineService.',
      );
    }

    return withTransaction(async (tx) => {
      const existing = await salesOrderRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${id} not found`);
      }

      if (validated.customer_id && validated.customer_id !== existing.customer_id) {
        const customer = await customerRepository.findById(organizationId, validated.customer_id, tx);
        if (!customer) {
          throw new CustomerNotFoundError(`Customer with ID ${validated.customer_id} not found`);
        }
      }

      if (validated.order_number && validated.order_number.trim() !== existing.order_number) {
        const newOrderNum = validated.order_number.trim();
        const duplicate = await salesOrderRepository.findByOrderNumber(organizationId, newOrderNum, tx);
        if (duplicate) {
          throw new DuplicateOrderNumberError(
            `Sales order number '${newOrderNum}' already exists in organization`,
          );
        }
      }

      const updatedData: UpdateSalesOrderInput = {
        ...validated,
        order_number: validated.order_number ? validated.order_number.trim() : undefined,
        notes: validated.notes !== undefined ? (validated.notes ? validated.notes.trim() : null) : undefined,
      };

      const updated = (await salesOrderRepository.update(organizationId, id, updatedData, tx))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
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

      return updated;
    });
  }

  async deleteSalesOrder(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existing = await salesOrderRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${id} not found`);
      }

      const deleted = await salesOrderRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'SALES_ORDER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: {
            order_number: existing.order_number,
            customer_id: existing.customer_id,
            total_amount: existing.total_amount,
          },
        },
        tx,
      );

      return deleted;
    });
  }

  async listSalesOrders(
    organizationId: string,
    params?: SalesOrderFilterParams,
  ): Promise<PaginatedResult<SalesOrder>> {
    return salesOrderRepository.listByOrganization(organizationId, params || {});
  }

  async searchSalesOrders(
    organizationId: string,
    searchParams: SalesOrderFilterParams,
  ): Promise<PaginatedResult<SalesOrder>> {
    return salesOrderRepository.search(organizationId, searchParams);
  }

  async getSalesOrderItems(organizationId: string, salesOrderId: string): Promise<SalesOrderItem[]> {
    await this.getSalesOrderById(organizationId, salesOrderId);
    return salesOrderRepository.listItems(organizationId, salesOrderId);
  }

  async addSalesOrderItem(
    organizationId: string,
    salesOrderId: string,
    data: CreateSalesOrderItemInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrderItem> {
    const parseResult = createSalesOrderItemSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid sales order item payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    return withTransaction(async (tx) => {
      const order = await salesOrderRepository.findById(organizationId, salesOrderId, tx);
      if (!order) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${salesOrderId} not found`);
      }

      const product = await productRepository.findById(organizationId, validated.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${validated.product_id} not found`);
      }

      const computed = this.calculateItemTotals(
        validated.quantity,
        validated.unit_price,
        validated.discount_amount,
        validated.tax_rate,
      );

      const createdItem = await salesOrderRepository.createItem(
        {
          ...validated,
          organization_id: organizationId,
          sales_order_id: salesOrderId,
          quantity: computed.quantity,
          unit_price: computed.unit_price,
          discount_amount: computed.discount_amount,
          tax_rate: computed.tax_rate,
          tax_amount: computed.tax_amount,
          line_total: computed.line_total,
        },
        tx,
      );

      // Recalculate order totals
      const currentItems = await salesOrderRepository.listItems(organizationId, salesOrderId, tx);
      const newTotals = this.calculateOrderTotals(currentItems);

      await salesOrderRepository.update(
        organizationId,
        salesOrderId,
        {
          subtotal: newTotals.subtotal,
          tax_amount: newTotals.tax_amount,
          discount_amount: newTotals.discount_amount,
          total_amount: newTotals.total_amount,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
          entity_id: salesOrderId,
          request_id: requestId,
          success: true,
          metadata: {
            action_detail: 'ADD_ITEM',
            item_id: createdItem.id,
            product_id: createdItem.product_id,
            line_total: createdItem.line_total,
            new_order_total: newTotals.total_amount,
          },
        },
        tx,
      );

      return createdItem;
    });
  }

  async updateSalesOrderItem(
    organizationId: string,
    id: string,
    data: UpdateSalesOrderItemInput,
    userId?: string,
    requestId?: string,
  ): Promise<SalesOrderItem> {
    const parseResult = updateSalesOrderItemSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid sales order item update payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    return withTransaction(async (tx) => {
      const existingItem = await salesOrderRepository.findItemById(organizationId, id, tx);
      if (!existingItem) {
        throw new SalesOrderItemNotFoundError(`Sales order item with ID ${id} not found`);
      }

      const order = await salesOrderRepository.findById(organizationId, existingItem.sales_order_id, tx);
      if (!order) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${existingItem.sales_order_id} not found`);
      }

      if (validated.product_id && validated.product_id !== existingItem.product_id) {
        const product = await productRepository.findById(organizationId, validated.product_id, tx);
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${validated.product_id} not found`);
        }
      }

      const finalQty = validated.quantity !== undefined ? validated.quantity : existingItem.quantity;
      const finalPrice = validated.unit_price !== undefined ? validated.unit_price : existingItem.unit_price;
      const finalDiscount =
        validated.discount_amount !== undefined ? validated.discount_amount : existingItem.discount_amount;
      const finalRate = validated.tax_rate !== undefined ? validated.tax_rate : existingItem.tax_rate;

      const computed = this.calculateItemTotals(finalQty, finalPrice, finalDiscount, finalRate);

      const updatedItem = (await salesOrderRepository.updateItem(
        organizationId,
        id,
        {
          ...validated,
          quantity: computed.quantity,
          unit_price: computed.unit_price,
          discount_amount: computed.discount_amount,
          tax_rate: computed.tax_rate,
          tax_amount: computed.tax_amount,
          line_total: computed.line_total,
        },
        tx,
      ))!;

      // Recalculate order totals
      const currentItems = await salesOrderRepository.listItems(organizationId, existingItem.sales_order_id, tx);
      const newTotals = this.calculateOrderTotals(currentItems);

      await salesOrderRepository.update(
        organizationId,
        existingItem.sales_order_id,
        {
          subtotal: newTotals.subtotal,
          tax_amount: newTotals.tax_amount,
          discount_amount: newTotals.discount_amount,
          total_amount: newTotals.total_amount,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
          entity_id: existingItem.sales_order_id,
          request_id: requestId,
          success: true,
          metadata: {
            action_detail: 'UPDATE_ITEM',
            item_id: id,
            new_line_total: computed.line_total,
            new_order_total: newTotals.total_amount,
          },
        },
        tx,
      );

      return updatedItem;
    });
  }

  async deleteSalesOrderItem(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existingItem = await salesOrderRepository.findItemById(organizationId, id, tx);
      if (!existingItem) {
        throw new SalesOrderItemNotFoundError(`Sales order item with ID ${id} not found`);
      }

      const order = await salesOrderRepository.findById(organizationId, existingItem.sales_order_id, tx);
      if (!order) {
        throw new SalesOrderNotFoundError(`Sales order with ID ${existingItem.sales_order_id} not found`);
      }

      const deleted = await salesOrderRepository.deleteItem(organizationId, id, tx);

      // Recalculate order totals
      const currentItems = await salesOrderRepository.listItems(organizationId, existingItem.sales_order_id, tx);
      const newTotals = this.calculateOrderTotals(currentItems);

      await salesOrderRepository.update(
        organizationId,
        existingItem.sales_order_id,
        {
          subtotal: newTotals.subtotal,
          tax_amount: newTotals.tax_amount,
          discount_amount: newTotals.discount_amount,
          total_amount: newTotals.total_amount,
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
          entity_id: existingItem.sales_order_id,
          request_id: requestId,
          success: true,
          metadata: {
            action_detail: 'DELETE_ITEM',
            deleted_item_id: id,
            new_order_total: newTotals.total_amount,
          },
        },
        tx,
      );

      return deleted;
    });
  }
}

export const salesOrderService = new SalesOrderService();
