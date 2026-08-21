import { PoolClient } from 'pg';
import {
  purchaseReceiptRepository,
  PurchaseReceiptFilterParams,
} from '../repositories/purchaseReceipt.repository';
import { purchaseOrderRepository } from '../repositories/purchaseOrder.repository';
import { warehouseRepository } from '../repositories/warehouse.repository';
import { productRepository } from '../repositories/product.repository';
import { inventoryService } from './inventory.service';
import { purchaseReceiptStateMachineService } from './purchaseReceiptStateMachine.service';
import { purchaseOrderStateMachineService } from './purchaseOrderStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  PurchaseReceipt,
  PurchaseReceiptItem,
  CreatePurchaseReceiptInput,
  CreatePurchaseReceiptItemInput,
  UpdatePurchaseReceiptItemInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  PurchaseReceiptNotFoundError,
  PurchaseReceiptItemNotFoundError,
  PurchaseReceiptAlreadyPostedError,
  PurchaseReceiptEmptyError,
  PurchaseOrderNotFoundError,
  PurchaseOrderNotReceivableError,
  WarehouseNotFoundError,
  ProductNotFoundError,
  OverReceivingError,
  DuplicatePurchaseReceiptNumberError,
  InvalidPurchaseReceiptProductError,
  ValidationError,
} from '../types';
import {
  toDecimal,
  formatDecimal,
  compareDecimal,
  subtractDecimal,
  MONEY_SCALE,
  QUANTITY_SCALE,
} from '../utils/decimal';

export interface CreatePurchaseReceiptItemData {
  purchase_order_item_id: string;
  product_id: string;
  quantity: number | string;
  unit_cost?: number | string;
}

export interface CreatePurchaseReceiptServiceInput {
  organization_id: string;
  purchase_order_id: string;
  warehouse_id: string;
  receipt_number?: string;
  receipt_date?: Date | string;
  notes?: string | null;
  items: CreatePurchaseReceiptItemData[];
}

export interface PurchaseReceiptWithItems extends PurchaseReceipt {
  items: PurchaseReceiptItem[];
}

export class PurchaseReceiptService {
  /**
   * Generates a unique receipt number per organization.
   */
  private async generateReceiptNumber(organizationId: string, tx?: PoolClient): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `REC-${timestamp}${random}`;

    let existing = await purchaseReceiptRepository.findByReceiptNumber(
      organizationId,
      candidate,
      tx,
    );
    while (existing) {
      const nextRandom = Math.floor(1000 + Math.random() * 9000);
      candidate = `REC-${timestamp}${nextRandom}`;
      existing = await purchaseReceiptRepository.findByReceiptNumber(
        organizationId,
        candidate,
        tx,
      );
    }
    return candidate;
  }

  /**
   * Creates a new Purchase Receipt in DRAFT status.
   * NOTE: Creating a draft receipt DOES NOT modify physical stock!
   */
  async createReceipt(
    input: CreatePurchaseReceiptServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceiptWithItems> {
    return withTransaction(async (tx) => {
      // 1. Validate Purchase Order
      const po = await purchaseOrderRepository.findById(
        input.organization_id,
        input.purchase_order_id,
        tx,
      );
      if (!po) {
        throw new PurchaseOrderNotFoundError(
          `Purchase order with ID ${input.purchase_order_id} not found`,
        );
      }

      const receivableStatuses = ['approved', 'processing', 'partially_received'];
      if (!receivableStatuses.includes(po.status)) {
        throw new PurchaseOrderNotReceivableError(
          `Purchase order ${po.order_number} is in status '${po.status}' and cannot receive goods`,
        );
      }

      // 2. Validate Warehouse
      const warehouse = await warehouseRepository.findById(
        input.organization_id,
        input.warehouse_id,
        tx,
      );
      if (!warehouse) {
        throw new WarehouseNotFoundError(`Warehouse with ID ${input.warehouse_id} not found`);
      }

      // 3. Require at least one item
      if (!input.items || input.items.length === 0) {
        throw new PurchaseReceiptEmptyError(
          'Purchase receipt must contain at least one item upon creation',
        );
      }

      // 4. Validate receipt number or generate candidate
      let receiptNumber = input.receipt_number?.trim();
      if (receiptNumber) {
        const existing = await purchaseReceiptRepository.findByReceiptNumber(
          input.organization_id,
          receiptNumber,
          tx,
        );
        if (existing) {
          throw new DuplicatePurchaseReceiptNumberError(
            `Receipt number '${receiptNumber}' already exists in organization`,
          );
        }
      } else {
        receiptNumber = await this.generateReceiptNumber(input.organization_id, tx);
      }

      // 5. Validate products & PO items
      const poItems = await purchaseOrderRepository.listItems(
        input.organization_id,
        input.purchase_order_id,
        tx,
      );
      const poItemMap = new Map(poItems.map((item) => [item.id, item]));

      const processedItems: Array<{
        purchase_order_item_id: string;
        product_id: string;
        quantity: string;
        unit_cost: string;
      }> = [];

      for (const item of input.items) {
        const poItem = poItemMap.get(item.purchase_order_item_id);
        if (!poItem) {
          throw new ValidationError(
            `Purchase order item with ID ${item.purchase_order_item_id} does not belong to purchase order ${po.order_number}`,
          );
        }

        if (poItem.product_id !== item.product_id) {
          throw new InvalidPurchaseReceiptProductError(
            `Product ID ${item.product_id} does not match Purchase Order item product ${poItem.product_id}`,
          );
        }

        const product = await productRepository.findById(
          input.organization_id,
          item.product_id,
          tx,
        );
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${item.product_id} not found`);
        }

        let qtyDec;
        try {
          qtyDec = toDecimal(item.quantity);
        } catch {
          throw new ValidationError('Invalid receiving quantity format');
        }
        if (compareDecimal(qtyDec, 0) <= 0) {
          throw new ValidationError('Receiving quantity must be greater than zero');
        }

        const unitCostDec =
          item.unit_cost !== undefined ? toDecimal(item.unit_cost) : toDecimal(poItem.unit_cost);
        if (compareDecimal(unitCostDec, 0) < 0) {
          throw new ValidationError('Unit cost cannot be negative');
        }

        processedItems.push({
          purchase_order_item_id: item.purchase_order_item_id,
          product_id: item.product_id,
          quantity: formatDecimal(qtyDec, QUANTITY_SCALE),
          unit_cost: formatDecimal(unitCostDec, MONEY_SCALE),
        });
      }

      // 6. Create Purchase Receipt header
      const createHeaderData: CreatePurchaseReceiptInput = {
        organization_id: input.organization_id,
        purchase_order_id: input.purchase_order_id,
        receipt_number: receiptNumber,
        warehouse_id: input.warehouse_id,
        status: 'draft',
        receipt_date: input.receipt_date || new Date(),
        notes: input.notes || null,
        created_by: userId || null,
      };

      const receipt = await purchaseReceiptRepository.create(createHeaderData, tx);

      // 7. Create Purchase Receipt items
      const createdItems: PurchaseReceiptItem[] = [];
      for (const pItem of processedItems) {
        const itemInput: CreatePurchaseReceiptItemInput = {
          organization_id: input.organization_id,
          receipt_id: receipt.id,
          purchase_order_item_id: pItem.purchase_order_item_id,
          product_id: pItem.product_id,
          quantity: pItem.quantity,
          unit_cost: pItem.unit_cost,
        };
        const createdItem = await purchaseReceiptRepository.createItem(itemInput, tx);
        createdItems.push(createdItem);
      }

      // 8. Record Category A audit event
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receipt.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_CREATED',
            receipt_id: receipt.id,
            receipt_number: receipt.receipt_number,
            purchase_order_id: receipt.purchase_order_id,
            item_count: createdItems.length,
          },
        },
        tx,
      );

      return {
        ...receipt,
        items: createdItems,
      };
    });
  }

  /**
   * Retrieves Purchase Receipt details with items.
   */
  async getReceipt(
    organizationId: string,
    receiptId: string,
  ): Promise<PurchaseReceiptWithItems> {
    const receipt = await purchaseReceiptRepository.findById(organizationId, receiptId);
    if (!receipt) {
      throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
    }

    const items = await purchaseReceiptRepository.listItems(organizationId, receiptId);
    return {
      ...receipt,
      items,
    };
  }

  /**
   * Lists Purchase Receipts with filters and pagination.
   */
  async listReceipts(
    organizationId: string,
    params?: PurchaseReceiptFilterParams,
  ): Promise<PaginatedResult<PurchaseReceipt>> {
    return purchaseReceiptRepository.listReceipts(organizationId, params || {});
  }

  /**
   * Retrieves all Purchase Receipts for a given Purchase Order.
   */
  async getPurchaseOrderReceipts(
    organizationId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseReceipt[]> {
    return purchaseReceiptRepository.findByPurchaseOrderId(organizationId, purchaseOrderId);
  }

  /**
   * Adds an item to a draft Purchase Receipt.
   */
  async addItem(
    organizationId: string,
    receiptId: string,
    itemData: CreatePurchaseReceiptItemData,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceiptItem> {
    return withTransaction(async (tx) => {
      const receipt = await purchaseReceiptRepository.lockByIdForUpdate(
        organizationId,
        receiptId,
        tx,
      );
      if (!receipt) {
        throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
      }

      if (receipt.status !== 'draft') {
        throw new ValidationError('Items can only be added to purchase receipts in draft status');
      }

      const product = await productRepository.findById(organizationId, itemData.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${itemData.product_id} not found`);
      }

      let qtyDec;
      try {
        qtyDec = toDecimal(itemData.quantity);
      } catch {
        throw new ValidationError('Invalid receiving quantity format');
      }
      if (compareDecimal(qtyDec, 0) <= 0) {
        throw new ValidationError('Receiving quantity must be greater than zero');
      }

      const newItem = await purchaseReceiptRepository.createItem(
        {
          organization_id: organizationId,
          receipt_id: receiptId,
          purchase_order_item_id: itemData.purchase_order_item_id,
          product_id: itemData.product_id,
          quantity: formatDecimal(qtyDec, QUANTITY_SCALE),
          unit_cost:
            itemData.unit_cost !== undefined
              ? formatDecimal(toDecimal(itemData.unit_cost), MONEY_SCALE)
              : '0.0000',
        },
        tx,
      );

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receiptId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_ITEM_ADDED',
            receipt_id: receiptId,
            item_id: newItem.id,
            quantity: newItem.quantity,
          },
        },
        tx,
      );

      return newItem;
    });
  }

  /**
   * Updates an item in a draft Purchase Receipt.
   */
  async updateItem(
    organizationId: string,
    receiptId: string,
    itemId: string,
    updateData: UpdatePurchaseReceiptItemInput,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceiptItem> {
    return withTransaction(async (tx) => {
      const receipt = await purchaseReceiptRepository.lockByIdForUpdate(
        organizationId,
        receiptId,
        tx,
      );
      if (!receipt) {
        throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
      }

      if (receipt.status !== 'draft') {
        throw new ValidationError('Items can only be modified on purchase receipts in draft status');
      }

      const existingItem = await purchaseReceiptRepository.findItemById(
        organizationId,
        itemId,
        tx,
      );
      if (!existingItem || existingItem.receipt_id !== receiptId) {
        throw new PurchaseReceiptItemNotFoundError(`Purchase receipt item with ID ${itemId} not found`);
      }

      const updated = (await purchaseReceiptRepository.updateItem(
        organizationId,
        itemId,
        updateData,
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receiptId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_ITEM_UPDATED',
            receipt_id: receiptId,
            item_id: itemId,
            quantity: updated.quantity,
          },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Removes an item from a draft Purchase Receipt.
   */
  async removeItem(
    organizationId: string,
    receiptId: string,
    itemId: string,
    userId?: string,
    requestId?: string,
  ): Promise<void> {
    return withTransaction(async (tx) => {
      const receipt = await purchaseReceiptRepository.lockByIdForUpdate(
        organizationId,
        receiptId,
        tx,
      );
      if (!receipt) {
        throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
      }

      if (receipt.status !== 'draft') {
        throw new ValidationError('Items can only be removed from purchase receipts in draft status');
      }

      const existingItem = await purchaseReceiptRepository.findItemById(
        organizationId,
        itemId,
        tx,
      );
      if (!existingItem || existingItem.receipt_id !== receiptId) {
        throw new PurchaseReceiptItemNotFoundError(`Purchase receipt item with ID ${itemId} not found`);
      }

      await purchaseReceiptRepository.deleteItem(organizationId, itemId, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receiptId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_ITEM_REMOVED',
            receipt_id: receiptId,
            item_id: itemId,
          },
        },
        tx,
      );
    });
  }

  /**
   * Posts a Purchase Receipt:
   * THE CRITICAL TRANSACTION in Phase 029.
   *
   * 1. Locks receipt FOR UPDATE -> verifies status === 'draft'.
   * 2. Locks Purchase Order FOR UPDATE -> verifies receivable state.
   * 3. For each receipt item:
   *    - Verifies quantity <= remaining receivable quantity (OverReceivingError if exceeded).
   *    - Increases physical stock via inventoryService.increaseStock (writes StockLedgerEntry movement_type = 'IN').
   * 4. Updates receipt status to 'posted' & received_at = NOW.
   * 5. Synchronizes Purchase Order status to 'partially_received' or 'received'.
   * 6. Category A audit logging.
   */
  async postReceipt(
    organizationId: string,
    receiptId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceiptWithItems> {
    return withTransaction(async (tx) => {
      // 1. Lock Purchase Receipt FOR UPDATE
      const receipt = await purchaseReceiptRepository.lockByIdForUpdate(
        organizationId,
        receiptId,
        tx,
      );
      if (!receipt) {
        throw new PurchaseReceiptNotFoundError(`Purchase receipt with ID ${receiptId} not found`);
      }

      if (receipt.status === 'posted') {
        throw new PurchaseReceiptAlreadyPostedError(
          `Purchase receipt ${receipt.receipt_number} is already posted`,
        );
      }

      if (receipt.status !== 'draft') {
        throw new ValidationError(
          `Cannot post purchase receipt ${receipt.receipt_number} in status '${receipt.status}'`,
        );
      }

      // 2. Fetch receipt items
      const items = await purchaseReceiptRepository.listItems(organizationId, receiptId, tx);
      if (!items || items.length === 0) {
        throw new PurchaseReceiptEmptyError(
          `Purchase receipt ${receipt.receipt_number} has no items and cannot be posted`,
        );
      }

      // 3. Lock Purchase Order FOR UPDATE
      const po = await purchaseOrderRepository.lockByIdForUpdate(
        organizationId,
        receipt.purchase_order_id,
        tx,
      );
      if (!po) {
        throw new PurchaseOrderNotFoundError(
          `Purchase order with ID ${receipt.purchase_order_id} not found`,
        );
      }

      const receivableStatuses = ['approved', 'processing', 'partially_received'];
      if (!receivableStatuses.includes(po.status)) {
        throw new PurchaseOrderNotReceivableError(
          `Purchase order ${po.order_number} is in status '${po.status}' and cannot receive goods`,
        );
      }

      // 4. Over-receiving validation & physical stock increase for each item
      const poItems = await purchaseOrderRepository.listItems(
        organizationId,
        receipt.purchase_order_id,
        tx,
      );
      const poItemMap = new Map(poItems.map((item) => [item.id, item]));

      for (const item of items) {
        const poItem = poItemMap.get(item.purchase_order_item_id);
        if (!poItem) {
          throw new ValidationError(
            `Purchase order item ${item.purchase_order_item_id} not found on purchase order ${po.order_number}`,
          );
        }

        const prevReceivedStr =
          await purchaseReceiptRepository.getReceivedQuantityForPurchaseOrderItem(
            organizationId,
            item.purchase_order_item_id,
            tx,
          );

        const remainingReceivable = subtractDecimal(
          poItem.quantity,
          prevReceivedStr,
          QUANTITY_SCALE,
        );

        if (compareDecimal(item.quantity, remainingReceivable) > 0) {
          throw new OverReceivingError(
            `Receiving quantity (${item.quantity}) exceeds remaining receivable quantity (${remainingReceivable}) for product ${item.product_id}`,
          );
        }

        // Increase physical inventory (which also records stock ledger IN entry & audit event)
        await inventoryService.increaseStock(
          {
            organization_id: organizationId,
            product_id: item.product_id,
            warehouse_id: receipt.warehouse_id,
            quantity: item.quantity,
            reference_type: 'PURCHASE_RECEIPT',
            reference_id: receiptId,
            notes: `Received purchase receipt ${receipt.receipt_number}`,
          },
          userId,
          requestId,
        );
      }

      // 5. Update receipt status to 'posted' & set received_at
      const postedReceipt = (await purchaseReceiptRepository.update(
        organizationId,
        receiptId,
        {
          status: 'posted',
          received_at: new Date(),
          updated_by: userId || null,
        },
        tx,
      ))!;

      // 6. Synchronize Purchase Order status
      let allFullyReceived = true;
      for (const poItem of poItems) {
        const totalReceivedStr =
          await purchaseReceiptRepository.getReceivedQuantityForPurchaseOrderItem(
            organizationId,
            poItem.id,
            tx,
          );
        if (compareDecimal(totalReceivedStr, poItem.quantity) < 0) {
          allFullyReceived = false;
          break;
        }
      }

      if (allFullyReceived) {
        if (po.status !== 'received' && po.status !== 'completed') {
          await purchaseOrderStateMachineService.markReceived(
            organizationId,
            po.id,
            userId,
            requestId,
          );
        }
      } else {
        if (po.status !== 'partially_received') {
          await purchaseOrderStateMachineService.markPartiallyReceived(
            organizationId,
            po.id,
            userId,
            requestId,
          );
        }
      }

      // 7. Category A audit logging
      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'PURCHASE_RECEIPT',
          entity_id: receiptId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'PURCHASE_RECEIPT_POSTED',
            receipt_id: receiptId,
            receipt_number: postedReceipt.receipt_number,
            purchase_order_id: po.id,
            item_count: items.length,
          },
        },
        tx,
      );

      return {
        ...postedReceipt,
        items,
      };
    });
  }

  /**
   * Completes a posted Purchase Receipt.
   */
  async completeReceipt(
    organizationId: string,
    receiptId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceipt> {
    return purchaseReceiptStateMachineService.transitionReceipt(
      organizationId,
      receiptId,
      'completed',
      userId,
      requestId,
    );
  }

  /**
   * Cancels a Purchase Receipt (DRAFT -> CANCELLED).
   * NOTE: Cancelling a posted receipt is rejected.
   */
  async cancelReceipt(
    organizationId: string,
    receiptId: string,
    userId?: string,
    requestId?: string,
  ): Promise<PurchaseReceipt> {
    return purchaseReceiptStateMachineService.transitionReceipt(
      organizationId,
      receiptId,
      'cancelled',
      userId,
      requestId,
    );
  }
}

export const purchaseReceiptService = new PurchaseReceiptService();
