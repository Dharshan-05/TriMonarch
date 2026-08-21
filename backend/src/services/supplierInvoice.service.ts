import { PoolClient } from 'pg';
import {
  supplierInvoiceRepository,
  SupplierInvoiceFilterParams,
} from '../repositories/supplierInvoice.repository';
import { supplierRepository } from '../repositories/supplier.repository';
import { purchaseOrderRepository } from '../repositories/purchaseOrder.repository';
import { purchaseReceiptRepository } from '../repositories/purchaseReceipt.repository';
import { productRepository } from '../repositories/product.repository';
import { supplierInvoiceStateMachineService } from './supplierInvoiceStateMachine.service';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import {
  SupplierInvoice,
  SupplierInvoiceItem,
  CreateSupplierInvoiceInput,
  CreateSupplierInvoiceItemInput,
  UpdateSupplierInvoiceItemInput,
} from '../types/database';
import { PaginatedResult } from '../repositories/base';
import {
  SupplierInvoiceNotFoundError,
  SupplierInvoiceItemNotFoundError,
  SupplierInvoiceMissingItemsError,
  SupplierNotFoundError,
  PurchaseOrderNotFoundError,
  PurchaseReceiptNotFoundError,
  ProductNotFoundError,
  DuplicateSupplierInvoiceError,
  SupplierInvoiceSupplierMismatchError,
  SupplierInvoicePurchaseReceiptMismatchError,
  ValidationError,
} from '../types';
import {
  toDecimal,
  formatDecimal,
  compareDecimal,
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideDecimal,
  MONEY_SCALE,
  QUANTITY_SCALE,
} from '../utils/decimal';

export const QUANTITY_TOLERANCE = 0.0001;
export const PRICE_TOLERANCE = 0.01;

export interface CreateSupplierInvoiceItemData {
  product_id: string;
  purchase_order_item_id?: string | null;
  purchase_receipt_item_id?: string | null;
  description?: string | null;
  quantity: number | string;
  unit_cost: number | string;
  discount_amount?: number | string;
  tax_rate?: number | string;
}

export interface CreateSupplierInvoiceServiceInput {
  organization_id: string;
  supplier_id: string;
  purchase_order_id?: string | null;
  purchase_receipt_id?: string | null;
  invoice_number?: string;
  supplier_invoice_number: string;
  invoice_date?: Date | string;
  due_date?: Date | string | null;
  currency?: string;
  notes?: string | null;
  items: CreateSupplierInvoiceItemData[];
}

export interface SupplierInvoiceWithItems extends SupplierInvoice {
  items: SupplierInvoiceItem[];
}

export interface ThreeWayMatchResult {
  matched: boolean;
  quantityVariance: number;
  priceVariance: number;
  warnings: string[];
}

export class SupplierInvoiceService {
  /**
   * Generates a unique internal invoice number per organization.
   */
  private async generateInvoiceNumber(organizationId: string, tx?: PoolClient): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    let candidate = `PINV-${year}-${timestamp}${random}`;

    let existing = await supplierInvoiceRepository.findByInvoiceNumber(
      organizationId,
      candidate,
      tx,
    );
    while (existing) {
      const nextRandom = Math.floor(1000 + Math.random() * 9000);
      candidate = `PINV-${year}-${timestamp}${nextRandom}`;
      existing = await supplierInvoiceRepository.findByInvoiceNumber(
        organizationId,
        candidate,
        tx,
      );
    }
    return candidate;
  }

  /**
   * Recalculates single line item monetary values using exact Decimal primitives.
   */
  public calculateLineItem(item: {
    quantity: number | string;
    unit_cost: number | string;
    discount_amount?: number | string;
    tax_rate?: number | string;
  }) {
    const qty = toDecimal(item.quantity);
    const unitCost = toDecimal(item.unit_cost);
    const discount = item.discount_amount !== undefined ? toDecimal(item.discount_amount) : toDecimal(0);
    const taxRate = item.tax_rate !== undefined ? toDecimal(item.tax_rate) : toDecimal(0);

    const gross = multiplyDecimal(qty, unitCost, MONEY_SCALE);
    const netBeforeTax = subtractDecimal(gross, discount, MONEY_SCALE);
    const taxAmount = divideDecimal(
      multiplyDecimal(netBeforeTax, taxRate, MONEY_SCALE),
      toDecimal(100),
      MONEY_SCALE,
    );
    const lineTotal = addDecimal(netBeforeTax, taxAmount, MONEY_SCALE);

    return {
      quantity: formatDecimal(qty, QUANTITY_SCALE),
      unit_cost: formatDecimal(unitCost, MONEY_SCALE),
      discount_amount: formatDecimal(discount, MONEY_SCALE),
      tax_rate: formatDecimal(taxRate, MONEY_SCALE),
      tax_amount: formatDecimal(taxAmount, MONEY_SCALE),
      line_total: formatDecimal(lineTotal, MONEY_SCALE),
      net_before_tax: formatDecimal(netBeforeTax, MONEY_SCALE),
    };
  }

  /**
   * Recalculates invoice header totals from items list.
   */
  public calculateInvoiceTotals(items: SupplierInvoiceItem[]) {
    let subtotalStr = '0.0000';
    let discountStr = '0.0000';
    let taxStr = '0.0000';

    for (const item of items) {
      const calc = this.calculateLineItem(item);
      subtotalStr = addDecimal(subtotalStr, calc.net_before_tax, MONEY_SCALE);
      discountStr = addDecimal(discountStr, calc.discount_amount, MONEY_SCALE);
      taxStr = addDecimal(taxStr, calc.tax_amount, MONEY_SCALE);
    }

    const totalStr = addDecimal(subtotalStr, taxStr, MONEY_SCALE);

    return {
      subtotal: subtotalStr,
      discount_amount: discountStr,
      tax_amount: taxStr,
      total_amount: totalStr,
    };
  }

  /**
   * Creates a DRAFT Supplier Invoice with items.
   * NOTE: Creating a draft invoice DOES NOT modify physical stock or stock ledger!
   */
  async createInvoice(
    input: CreateSupplierInvoiceServiceInput,
    userId?: string,
    requestId?: string,
  ): Promise<SupplierInvoiceWithItems> {
    return withTransaction(async (tx) => {
      // 1. Validate Supplier
      const supplier = await supplierRepository.findById(
        input.organization_id,
        input.supplier_id,
        tx,
      );
      if (!supplier) {
        throw new SupplierNotFoundError(`Supplier with ID ${input.supplier_id} not found`);
      }

      // 2. Validate PO if present
      if (input.purchase_order_id) {
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
        if (po.supplier_id !== input.supplier_id) {
          throw new SupplierInvoiceSupplierMismatchError(
            `Purchase order supplier ${po.supplier_id} does not match invoice supplier ${input.supplier_id}`,
          );
        }
      }

      // 3. Validate Receipt if present
      if (input.purchase_receipt_id) {
        const receipt = await purchaseReceiptRepository.findById(
          input.organization_id,
          input.purchase_receipt_id,
          tx,
        );
        if (!receipt) {
          throw new PurchaseReceiptNotFoundError(
            `Purchase receipt with ID ${input.purchase_receipt_id} not found`,
          );
        }
        if (input.purchase_order_id && receipt.purchase_order_id !== input.purchase_order_id) {
          throw new SupplierInvoicePurchaseReceiptMismatchError(
            `Purchase receipt PO ${receipt.purchase_order_id} does not match invoice PO ${input.purchase_order_id}`,
          );
        }
      }

      // 4. Validate duplicate supplier invoice number
      const duplicate = await supplierInvoiceRepository.findDuplicateSupplierInvoice(
        input.organization_id,
        input.supplier_id,
        input.supplier_invoice_number,
        tx,
      );
      if (duplicate) {
        throw new DuplicateSupplierInvoiceError(
          `Supplier invoice number '${input.supplier_invoice_number}' already exists for this supplier`,
        );
      }

      // 5. Generate internal invoice_number if missing
      let invoiceNumber = input.invoice_number?.trim();
      if (invoiceNumber) {
        const existing = await supplierInvoiceRepository.findByInvoiceNumber(
          input.organization_id,
          invoiceNumber,
          tx,
        );
        if (existing) {
          throw new ValidationError(`Internal invoice number '${invoiceNumber}' already exists`);
        }
      } else {
        invoiceNumber = await this.generateInvoiceNumber(input.organization_id, tx);
      }

      // 6. Process items & calculate item values
      if (!input.items || input.items.length === 0) {
        throw new SupplierInvoiceMissingItemsError(
          'Supplier invoice must contain at least one line item',
        );
      }

      const processedItems: Array<
        CreateSupplierInvoiceItemInput & { net_before_tax: string }
      > = [];

      for (const item of input.items) {
        const product = await productRepository.findById(
          input.organization_id,
          item.product_id,
          tx,
        );
        if (!product) {
          throw new ProductNotFoundError(`Product with ID ${item.product_id} not found`);
        }

        const qtyDec = toDecimal(item.quantity);
        if (compareDecimal(qtyDec, 0) <= 0) {
          throw new ValidationError('Line item quantity must be greater than zero');
        }

        const unitCostDec = toDecimal(item.unit_cost);
        if (compareDecimal(unitCostDec, 0) < 0) {
          throw new ValidationError('Line item unit cost cannot be negative');
        }

        const calc = this.calculateLineItem(item);

        processedItems.push({
          organization_id: input.organization_id,
          invoice_id: '', // set after header creation
          purchase_order_item_id: item.purchase_order_item_id || null,
          purchase_receipt_item_id: item.purchase_receipt_item_id || null,
          product_id: item.product_id,
          description: item.description || product.name,
          quantity: calc.quantity,
          unit_cost: calc.unit_cost,
          discount_amount: calc.discount_amount,
          tax_rate: calc.tax_rate,
          tax_amount: calc.tax_amount,
          line_total: calc.line_total,
          net_before_tax: calc.net_before_tax,
        });
      }

      // 7. Calculate header totals
      let subtotalStr = '0.0000';
      let discountStr = '0.0000';
      let taxStr = '0.0000';

      for (const pItem of processedItems) {
        subtotalStr = addDecimal(subtotalStr, pItem.net_before_tax, MONEY_SCALE);
        discountStr = addDecimal(discountStr, pItem.discount_amount || '0.0000', MONEY_SCALE);
        taxStr = addDecimal(taxStr, pItem.tax_amount || '0.0000', MONEY_SCALE);
      }

      const totalStr = addDecimal(subtotalStr, taxStr, MONEY_SCALE);

      // 8. Create Header
      const createHeaderData: CreateSupplierInvoiceInput = {
        organization_id: input.organization_id,
        supplier_id: input.supplier_id,
        purchase_order_id: input.purchase_order_id || null,
        purchase_receipt_id: input.purchase_receipt_id || null,
        invoice_number: invoiceNumber,
        supplier_invoice_number: input.supplier_invoice_number,
        status: 'draft',
        invoice_date: input.invoice_date || new Date(),
        due_date: input.due_date || null,
        currency: input.currency || 'INR',
        subtotal: subtotalStr,
        discount_amount: discountStr,
        tax_amount: taxStr,
        total_amount: totalStr,
        amount_paid: '0.0000',
        amount_due: totalStr,
        notes: input.notes || null,
        created_by: userId || null,
      };

      const invoice = await supplierInvoiceRepository.create(createHeaderData, tx);

      // 9. Create Items
      const createdItems: SupplierInvoiceItem[] = [];
      for (const pItem of processedItems) {
        const itemInput: CreateSupplierInvoiceItemInput = {
          ...pItem,
          invoice_id: invoice.id,
        };
        const createdItem = await supplierInvoiceRepository.createItem(itemInput, tx);
        createdItems.push(createdItem);
      }

      // 10. Audit Event
      await auditService.recordAuditEvent(
        {
          organization_id: input.organization_id,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SUPPLIER_INVOICE',
          entity_id: invoice.id,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'SUPPLIER_INVOICE_CREATED',
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            supplier_id: invoice.supplier_id,
            total_amount: invoice.total_amount,
          },
        },
        tx,
      );

      return {
        ...invoice,
        items: createdItems,
      };
    });
  }

  /**
   * Retrieves invoice with line items.
   */
  async getInvoice(
    organizationId: string,
    invoiceId: string,
  ): Promise<SupplierInvoiceWithItems> {
    const invoice = await supplierInvoiceRepository.findById(organizationId, invoiceId);
    if (!invoice) {
      throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
    }

    const items = await supplierInvoiceRepository.listItems(organizationId, invoiceId);
    return {
      ...invoice,
      items,
    };
  }

  /**
   * Lists Supplier Invoices with filtering and pagination.
   */
  async listInvoices(
    organizationId: string,
    params?: SupplierInvoiceFilterParams,
  ): Promise<PaginatedResult<SupplierInvoice>> {
    return supplierInvoiceRepository.listInvoices(organizationId, params || {});
  }

  /**
   * Adds item to draft invoice and updates header totals.
   */
  async addItem(
    organizationId: string,
    invoiceId: string,
    itemData: CreateSupplierInvoiceItemData,
    _userId?: string,
    _requestId?: string,
  ): Promise<SupplierInvoiceItem> {
    return withTransaction(async (tx) => {
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        organizationId,
        invoiceId,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
      }

      if (invoice.status !== 'draft') {
        throw new ValidationError('Items can only be added to supplier invoices in draft status');
      }

      const product = await productRepository.findById(organizationId, itemData.product_id, tx);
      if (!product) {
        throw new ProductNotFoundError(`Product with ID ${itemData.product_id} not found`);
      }

      const calc = this.calculateLineItem(itemData);

      const newItem = await supplierInvoiceRepository.createItem(
        {
          organization_id: organizationId,
          invoice_id: invoiceId,
          purchase_order_item_id: itemData.purchase_order_item_id || null,
          purchase_receipt_item_id: itemData.purchase_receipt_item_id || null,
          product_id: itemData.product_id,
          description: itemData.description || product.name,
          quantity: calc.quantity,
          unit_cost: calc.unit_cost,
          discount_amount: calc.discount_amount,
          tax_rate: calc.tax_rate,
          tax_amount: calc.tax_amount,
          line_total: calc.line_total,
        },
        tx,
      );

      // Recalculate header
      const allItems = await supplierInvoiceRepository.listItems(organizationId, invoiceId, tx);
      const totals = this.calculateInvoiceTotals(allItems);

      await supplierInvoiceRepository.update(
        organizationId,
        invoiceId,
        {
          subtotal: totals.subtotal,
          discount_amount: totals.discount_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          amount_due: totals.total_amount,
        },
        tx,
      );

      return newItem;
    });
  }

  /**
   * Updates item in draft invoice and recalculates header totals.
   */
  async updateItem(
    organizationId: string,
    invoiceId: string,
    itemId: string,
    updateData: UpdateSupplierInvoiceItemInput,
    _userId?: string,
    _requestId?: string,
  ): Promise<SupplierInvoiceItem> {
    return withTransaction(async (tx) => {
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        organizationId,
        invoiceId,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
      }

      if (invoice.status !== 'draft') {
        throw new ValidationError('Items can only be modified on supplier invoices in draft status');
      }

      const existingItem = await supplierInvoiceRepository.findItemById(
        organizationId,
        itemId,
        tx,
      );
      if (!existingItem || existingItem.invoice_id !== invoiceId) {
        throw new SupplierInvoiceItemNotFoundError(`Supplier invoice item with ID ${itemId} not found`);
      }

      const merged = {
        quantity: updateData.quantity !== undefined ? updateData.quantity : existingItem.quantity,
        unit_cost: updateData.unit_cost !== undefined ? updateData.unit_cost : existingItem.unit_cost,
        discount_amount:
          updateData.discount_amount !== undefined
            ? updateData.discount_amount
            : existingItem.discount_amount,
        tax_rate: updateData.tax_rate !== undefined ? updateData.tax_rate : existingItem.tax_rate,
      };

      const calc = this.calculateLineItem(merged);

      const updatedItem = (await supplierInvoiceRepository.updateItem(
        organizationId,
        itemId,
        {
          ...updateData,
          quantity: calc.quantity,
          unit_cost: calc.unit_cost,
          discount_amount: calc.discount_amount,
          tax_rate: calc.tax_rate,
          tax_amount: calc.tax_amount,
          line_total: calc.line_total,
        },
        tx,
      ))!;

      // Recalculate header
      const allItems = await supplierInvoiceRepository.listItems(organizationId, invoiceId, tx);
      const totals = this.calculateInvoiceTotals(allItems);

      await supplierInvoiceRepository.update(
        organizationId,
        invoiceId,
        {
          subtotal: totals.subtotal,
          discount_amount: totals.discount_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          amount_due: totals.total_amount,
        },
        tx,
      );

      return updatedItem;
    });
  }

  /**
   * Removes item from draft invoice and recalculates header totals.
   */
  async removeItem(
    organizationId: string,
    invoiceId: string,
    itemId: string,
    _userId?: string,
    _requestId?: string,
  ): Promise<void> {
    return withTransaction(async (tx) => {
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        organizationId,
        invoiceId,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
      }

      if (invoice.status !== 'draft') {
        throw new ValidationError('Items can only be removed from supplier invoices in draft status');
      }

      const existingItem = await supplierInvoiceRepository.findItemById(
        organizationId,
        itemId,
        tx,
      );
      if (!existingItem || existingItem.invoice_id !== invoiceId) {
        throw new SupplierInvoiceItemNotFoundError(`Supplier invoice item with ID ${itemId} not found`);
      }

      await supplierInvoiceRepository.deleteItem(organizationId, itemId, tx);

      // Recalculate header
      const allItems = await supplierInvoiceRepository.listItems(organizationId, invoiceId, tx);
      const totals = this.calculateInvoiceTotals(allItems);

      await supplierInvoiceRepository.update(
        organizationId,
        invoiceId,
        {
          subtotal: totals.subtotal,
          discount_amount: totals.discount_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          amount_due: totals.total_amount,
        },
        tx,
      );
    });
  }

  /**
   * Performs three-way matching analysis between Invoice, PO, and Receipt.
   */
  async performThreeWayMatch(
    organizationId: string,
    invoiceId: string,
    client?: PoolClient,
  ): Promise<ThreeWayMatchResult> {
    const invoice = await supplierInvoiceRepository.findById(organizationId, invoiceId, client);
    if (!invoice) {
      throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
    }

    const items = await supplierInvoiceRepository.listItems(organizationId, invoiceId, client);
    const warnings: string[] = [];
    let quantityVariance = 0;
    let priceVariance = 0;
    let matched = true;

    // Check PO if linked
    if (invoice.purchase_order_id) {
      const poItems = await purchaseOrderRepository.listItems(
        organizationId,
        invoice.purchase_order_id,
        client,
      );
      const poItemMap = new Map(poItems.map((item) => [item.id, item]));

      for (const item of items) {
        if (item.purchase_order_item_id) {
          const poItem = poItemMap.get(item.purchase_order_item_id);
          if (!poItem) {
            warnings.push(
              `Invoice item ${item.id} references non-existent PO item ${item.purchase_order_item_id}`,
            );
            matched = false;
            continue;
          }

          const qDiff = Math.abs(Number(item.quantity) - Number(poItem.quantity));
          if (qDiff > QUANTITY_TOLERANCE) {
            quantityVariance += qDiff;
            warnings.push(
              `Quantity mismatch on product ${item.product_id}: Invoice (${item.quantity}) vs PO (${poItem.quantity})`,
            );
            matched = false;
          }

          const pDiff = Math.abs(Number(item.unit_cost) - Number(poItem.unit_cost));
          if (pDiff > PRICE_TOLERANCE) {
            priceVariance += pDiff;
            warnings.push(
              `Price mismatch on product ${item.product_id}: Invoice (${item.unit_cost}) vs PO (${poItem.unit_cost})`,
            );
          }
        }
      }
    }

    // Check Receipt if linked
    if (invoice.purchase_receipt_id) {
      const recItems = await purchaseReceiptRepository.listItems(
        organizationId,
        invoice.purchase_receipt_id,
        client,
      );
      const recItemMap = new Map(recItems.map((item) => [item.id, item]));

      for (const item of items) {
        if (item.purchase_receipt_item_id) {
          const recItem = recItemMap.get(item.purchase_receipt_item_id);
          if (!recItem) {
            warnings.push(
              `Invoice item ${item.id} references non-existent Receipt item ${item.purchase_receipt_item_id}`,
            );
            matched = false;
            continue;
          }

          const qDiff = Math.abs(Number(item.quantity) - Number(recItem.quantity));
          if (qDiff > QUANTITY_TOLERANCE) {
            quantityVariance += qDiff;
            warnings.push(
              `Quantity mismatch on product ${item.product_id}: Invoice (${item.quantity}) vs Receipt (${recItem.quantity})`,
            );
            matched = false;
          }
        }
      }
    }

    return {
      matched,
      quantityVariance,
      priceVariance,
      warnings,
    };
  }

  /**
   * Posts a Supplier Invoice:
   * 1. Locks invoice FOR UPDATE -> status must be 'draft'.
   * 2. Requires items.length > 0.
   * 3. Validates 3-way match foundation.
   * 4. Recalculates exact totals -> sets status = 'posted', amount_paid = '0', amount_due = total_amount.
   * 5. Audit logging.
   * NOTE: Posting a supplier invoice DOES NOT modify inventory or write stock ledger entries!
   */
  async postInvoice(
    organizationId: string,
    invoiceId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SupplierInvoiceWithItems> {
    return withTransaction(async (tx) => {
      const invoice = await supplierInvoiceRepository.lockByIdForUpdate(
        organizationId,
        invoiceId,
        tx,
      );
      if (!invoice) {
        throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
      }

      if (invoice.status !== 'draft') {
        throw new ValidationError(`Cannot post supplier invoice in status '${invoice.status}'`);
      }

      const items = await supplierInvoiceRepository.listItems(organizationId, invoiceId, tx);
      if (!items || items.length === 0) {
        throw new SupplierInvoiceMissingItemsError(
          `Supplier invoice ${invoice.invoice_number} has no items and cannot be posted`,
        );
      }

      // Three-way match check
      const matchResult = await this.performThreeWayMatch(organizationId, invoiceId, tx);
      if (matchResult.warnings.length > 0) {
        await auditService.recordAuditEvent(
          {
            organization_id: organizationId,
            user_id: userId,
            action: 'UPDATE',
            entity_type: 'SUPPLIER_INVOICE',
            entity_id: invoiceId,
            request_id: requestId,
            success: true,
            metadata: {
              event: 'THREE_WAY_MATCH_WARNING',
              warnings: matchResult.warnings,
            },
          },
          tx,
        );
      }

      const totals = this.calculateInvoiceTotals(items);

      const posted = (await supplierInvoiceRepository.update(
        organizationId,
        invoiceId,
        {
          status: 'posted',
          subtotal: totals.subtotal,
          discount_amount: totals.discount_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          amount_paid: '0.0000',
          amount_due: totals.total_amount,
          updated_by: userId || null,
        },
        tx,
      ))!;

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'SUPPLIER_INVOICE',
          entity_id: invoiceId,
          request_id: requestId,
          success: true,
          metadata: {
            event: 'SUPPLIER_INVOICE_POSTED',
            invoice_id: invoiceId,
            invoice_number: posted.invoice_number,
            total_amount: posted.total_amount,
            amount_due: posted.amount_due,
          },
        },
        tx,
      );

      return {
        ...posted,
        items,
      };
    });
  }

  /**
   * Cancels a Supplier Invoice (allowed for draft or posted with 0 payments).
   */
  async cancelInvoice(
    organizationId: string,
    invoiceId: string,
    userId?: string,
    requestId?: string,
  ): Promise<SupplierInvoice> {
    return supplierInvoiceStateMachineService.transitionInvoice(
      organizationId,
      invoiceId,
      'cancelled',
      userId,
      requestId,
    );
  }
}

export const supplierInvoiceService = new SupplierInvoiceService();
