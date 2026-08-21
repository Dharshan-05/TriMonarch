import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  SupplierInvoice,
  SupplierInvoiceItem,
  CreateSupplierInvoiceInput,
  UpdateSupplierInvoiceInput,
  CreateSupplierInvoiceItemInput,
  UpdateSupplierInvoiceItemInput,
  SupplierInvoiceStatus,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface SupplierInvoiceFilterParams extends BaseFilterParams {
  query?: string;
  supplier_id?: string;
  purchase_order_id?: string;
  purchase_receipt_id?: string;
  status?: SupplierInvoiceStatus;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export class SupplierInvoiceRepository extends BaseRepository<
  SupplierInvoice,
  CreateSupplierInvoiceInput,
  UpdateSupplierInvoiceInput,
  SupplierInvoiceFilterParams
> {
  protected readonly tableName = 'supplier_invoices';
  protected readonly allowedSortFields = [
    'invoice_number',
    'supplier_invoice_number',
    'invoice_date',
    'due_date',
    'total_amount',
    'amount_due',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateSupplierInvoiceInput, client?: PoolClient): Promise<SupplierInvoice> {
    const rows = await query<SupplierInvoice>(
      `INSERT INTO supplier_invoices (
         organization_id, supplier_id, purchase_order_id, purchase_receipt_id,
         invoice_number, supplier_invoice_number, status, invoice_date, due_date,
         currency, subtotal, discount_amount, tax_amount, total_amount,
         amount_paid, amount_due, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *;`,
      [
        data.organization_id,
        data.supplier_id,
        data.purchase_order_id || null,
        data.purchase_receipt_id || null,
        data.invoice_number,
        data.supplier_invoice_number,
        data.status || 'draft',
        data.invoice_date || new Date(),
        data.due_date || null,
        data.currency || 'INR',
        data.subtotal !== undefined ? String(data.subtotal) : '0.0000',
        data.discount_amount !== undefined ? String(data.discount_amount) : '0.0000',
        data.tax_amount !== undefined ? String(data.tax_amount) : '0.0000',
        data.total_amount !== undefined ? String(data.total_amount) : '0.0000',
        data.amount_paid !== undefined ? String(data.amount_paid) : '0.0000',
        data.amount_due !== undefined ? String(data.amount_due) : '0.0000',
        data.notes || null,
        data.created_by || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<SupplierInvoice | null> {
    return queryOne<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice | null> {
    return queryOne<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async findByInvoiceNumber(
    organizationId: string,
    invoiceNumber: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice | null> {
    return queryOne<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE invoice_number = $1 AND organization_id = $2;',
      [invoiceNumber, organizationId],
      client,
    );
  }

  async findDuplicateSupplierInvoice(
    organizationId: string,
    supplierId: string,
    supplierInvoiceNumber: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice | null> {
    return queryOne<SupplierInvoice>(
      `SELECT * FROM supplier_invoices
       WHERE organization_id = $1
         AND supplier_id = $2
         AND LOWER(supplier_invoice_number) = LOWER($3)
         AND status != 'cancelled';`,
      [organizationId, supplierId, supplierInvoiceNumber],
      client,
    );
  }

  async findBySupplier(
    organizationId: string,
    supplierId: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice[]> {
    return query<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE supplier_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [supplierId, organizationId],
      client,
    );
  }

  async findByPurchaseOrder(
    organizationId: string,
    purchaseOrderId: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice[]> {
    return query<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE purchase_order_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [purchaseOrderId, organizationId],
      client,
    );
  }

  async findByPurchaseReceipt(
    organizationId: string,
    purchaseReceiptId: string,
    client?: PoolClient,
  ): Promise<SupplierInvoice[]> {
    return query<SupplierInvoice>(
      'SELECT * FROM supplier_invoices WHERE purchase_receipt_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [purchaseReceiptId, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateSupplierInvoiceInput,
    client?: PoolClient,
  ): Promise<SupplierInvoice | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.supplier_id !== undefined) {
      fields.push(`supplier_id = $${idx++}`);
      values.push(data.supplier_id);
    }
    if (data.purchase_order_id !== undefined) {
      fields.push(`purchase_order_id = $${idx++}`);
      values.push(data.purchase_order_id);
    }
    if (data.purchase_receipt_id !== undefined) {
      fields.push(`purchase_receipt_id = $${idx++}`);
      values.push(data.purchase_receipt_id);
    }
    if (data.supplier_invoice_number !== undefined) {
      fields.push(`supplier_invoice_number = $${idx++}`);
      values.push(data.supplier_invoice_number);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.invoice_date !== undefined) {
      fields.push(`invoice_date = $${idx++}`);
      values.push(data.invoice_date);
    }
    if (data.due_date !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(data.due_date);
    }
    if (data.currency !== undefined) {
      fields.push(`currency = $${idx++}`);
      values.push(data.currency);
    }
    if (data.subtotal !== undefined) {
      fields.push(`subtotal = $${idx++}`);
      values.push(String(data.subtotal));
    }
    if (data.discount_amount !== undefined) {
      fields.push(`discount_amount = $${idx++}`);
      values.push(String(data.discount_amount));
    }
    if (data.tax_amount !== undefined) {
      fields.push(`tax_amount = $${idx++}`);
      values.push(String(data.tax_amount));
    }
    if (data.total_amount !== undefined) {
      fields.push(`total_amount = $${idx++}`);
      values.push(String(data.total_amount));
    }
    if (data.amount_paid !== undefined) {
      fields.push(`amount_paid = $${idx++}`);
      values.push(String(data.amount_paid));
    }
    if (data.amount_due !== undefined) {
      fields.push(`amount_due = $${idx++}`);
      values.push(String(data.amount_due));
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }
    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${idx++}`);
      values.push(data.updated_by);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE supplier_invoices SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<SupplierInvoice>(sql, values, client);
  }

  async deleteDraft(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      "DELETE FROM supplier_invoices WHERE id = $1 AND organization_id = $2 AND status = 'draft' RETURNING id;",
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: SupplierInvoiceFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(
        `(invoice_number ILIKE $${idx} OR supplier_invoice_number ILIKE $${idx} OR notes ILIKE $${idx})`,
      );
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.supplier_id) {
      conditions.push(`supplier_id = $${idx++}`);
      values.push(params.supplier_id);
    }

    if (params?.purchase_order_id) {
      conditions.push(`purchase_order_id = $${idx++}`);
      values.push(params.purchase_order_id);
    }

    if (params?.purchase_receipt_id) {
      conditions.push(`purchase_receipt_id = $${idx++}`);
      values.push(params.purchase_receipt_id);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.date_from) {
      conditions.push(`invoice_date >= $${idx++}`);
      values.push(params.date_from);
    }

    if (params?.date_to) {
      conditions.push(`invoice_date <= $${idx++}`);
      values.push(params.date_to);
    }

    if (params?.due_date_from) {
      conditions.push(`due_date >= $${idx++}`);
      values.push(params.due_date_from);
    }

    if (params?.due_date_to) {
      conditions.push(`due_date <= $${idx++}`);
      values.push(params.due_date_to);
    }

    return { conditions, values };
  }

  async listInvoices(
    organizationId: string,
    params?: SupplierInvoiceFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<SupplierInvoice>> {
    return this.listByOrganization(organizationId, params, client);
  }

  // Invoice Items CRUD
  async createItem(
    data: CreateSupplierInvoiceItemInput,
    client?: PoolClient,
  ): Promise<SupplierInvoiceItem> {
    const rows = await query<SupplierInvoiceItem>(
      `INSERT INTO supplier_invoice_items (
         organization_id, invoice_id, purchase_order_item_id, purchase_receipt_item_id,
         product_id, description, quantity, unit_cost, discount_amount, tax_rate, tax_amount, line_total
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *;`,
      [
        data.organization_id,
        data.invoice_id,
        data.purchase_order_item_id || null,
        data.purchase_receipt_item_id || null,
        data.product_id,
        data.description || null,
        String(data.quantity),
        String(data.unit_cost),
        data.discount_amount !== undefined ? String(data.discount_amount) : '0.0000',
        data.tax_rate !== undefined ? String(data.tax_rate) : '0.0000',
        data.tax_amount !== undefined ? String(data.tax_amount) : '0.0000',
        data.line_total !== undefined ? String(data.line_total) : '0.0000',
      ],
      client,
    );
    return rows[0]!;
  }

  async findItemById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SupplierInvoiceItem | null> {
    return queryOne<SupplierInvoiceItem>(
      'SELECT * FROM supplier_invoice_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    invoiceId: string,
    client?: PoolClient,
  ): Promise<SupplierInvoiceItem[]> {
    return query<SupplierInvoiceItem>(
      'SELECT * FROM supplier_invoice_items WHERE invoice_id = $1 AND organization_id = $2 ORDER BY created_at ASC;',
      [invoiceId, organizationId],
      client,
    );
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdateSupplierInvoiceItemInput,
    client?: PoolClient,
  ): Promise<SupplierInvoiceItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.product_id !== undefined) {
      fields.push(`product_id = $${idx++}`);
      values.push(data.product_id);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(String(data.quantity));
    }
    if (data.unit_cost !== undefined) {
      fields.push(`unit_cost = $${idx++}`);
      values.push(String(data.unit_cost));
    }
    if (data.discount_amount !== undefined) {
      fields.push(`discount_amount = $${idx++}`);
      values.push(String(data.discount_amount));
    }
    if (data.tax_rate !== undefined) {
      fields.push(`tax_rate = $${idx++}`);
      values.push(String(data.tax_rate));
    }
    if (data.tax_amount !== undefined) {
      fields.push(`tax_amount = $${idx++}`);
      values.push(String(data.tax_amount));
    }
    if (data.line_total !== undefined) {
      fields.push(`line_total = $${idx++}`);
      values.push(String(data.line_total));
    }

    if (fields.length === 0) {
      return this.findItemById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE supplier_invoice_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<SupplierInvoiceItem>(sql, values, client);
  }

  async deleteItem(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM supplier_invoice_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }

  // AP Queries
  async calculateOutstanding(
    organizationId: string,
    supplierId: string,
    client?: PoolClient,
  ): Promise<string> {
    const row = await queryOne<{ outstanding: string }>(
      `SELECT COALESCE(SUM(amount_due), 0)::text AS outstanding
       FROM supplier_invoices
       WHERE organization_id = $1
         AND supplier_id = $2
         AND status IN ('posted', 'partially_paid');`,
      [organizationId, supplierId],
      client,
    );
    return row?.outstanding || '0.0000';
  }

  async getAPSummary(
    organizationId: string,
    client?: PoolClient,
  ): Promise<{
    total_invoiced: string;
    total_paid: string;
    total_outstanding: string;
    overdue_amount: string;
  }> {
    const row = await queryOne<{
      total_invoiced: string;
      total_paid: string;
      total_outstanding: string;
      overdue_amount: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('posted', 'partially_paid', 'paid') THEN total_amount ELSE 0 END), 0)::text AS total_invoiced,
         COALESCE(SUM(CASE WHEN status IN ('posted', 'partially_paid', 'paid') THEN amount_paid ELSE 0 END), 0)::text AS total_paid,
         COALESCE(SUM(CASE WHEN status IN ('posted', 'partially_paid') THEN amount_due ELSE 0 END), 0)::text AS total_outstanding,
         COALESCE(SUM(CASE WHEN status IN ('posted', 'partially_paid') AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN amount_due ELSE 0 END), 0)::text AS overdue_amount
       FROM supplier_invoices
       WHERE organization_id = $1;`,
      [organizationId],
      client,
    );

    return {
      total_invoiced: row?.total_invoiced || '0.0000',
      total_paid: row?.total_paid || '0.0000',
      total_outstanding: row?.total_outstanding || '0.0000',
      overdue_amount: row?.overdue_amount || '0.0000',
    };
  }

  async getAPAging(
    organizationId: string,
    client?: PoolClient,
  ): Promise<{
    current: string;
    days_1_30: string;
    days_31_60: string;
    days_61_90: string;
    days_90_plus: string;
  }> {
    const row = await queryOne<{
      current_amt: string;
      days_1_30_amt: string;
      days_31_60_amt: string;
      days_61_90_amt: string;
      days_90_plus_amt: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN due_date IS NULL OR due_date >= CURRENT_DATE THEN amount_due ELSE 0 END), 0)::text AS current_amt,
         COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND (CURRENT_DATE - due_date) BETWEEN 1 AND 30 THEN amount_due ELSE 0 END), 0)::text AS days_1_30_amt,
         COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND (CURRENT_DATE - due_date) BETWEEN 31 AND 60 THEN amount_due ELSE 0 END), 0)::text AS days_31_60_amt,
         COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND (CURRENT_DATE - due_date) BETWEEN 61 AND 90 THEN amount_due ELSE 0 END), 0)::text AS days_61_90_amt,
         COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND (CURRENT_DATE - due_date) > 90 THEN amount_due ELSE 0 END), 0)::text AS days_90_plus_amt
       FROM supplier_invoices
       WHERE organization_id = $1 AND status IN ('posted', 'partially_paid');`,
      [organizationId],
      client,
    );

    return {
      current: row?.current_amt || '0.0000',
      days_1_30: row?.days_1_30_amt || '0.0000',
      days_31_60: row?.days_31_60_amt || '0.0000',
      days_61_90: row?.days_61_90_amt || '0.0000',
      days_90_plus: row?.days_90_plus_amt || '0.0000',
    };
  }
}

export const supplierInvoiceRepository = new SupplierInvoiceRepository();
