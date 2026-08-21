import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  PurchaseReceipt,
  PurchaseReceiptItem,
  CreatePurchaseReceiptInput,
  UpdatePurchaseReceiptInput,
  CreatePurchaseReceiptItemInput,
  UpdatePurchaseReceiptItemInput,
  PurchaseReceiptStatus,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface PurchaseReceiptFilterParams extends BaseFilterParams {
  query?: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  status?: PurchaseReceiptStatus;
  startDate?: string;
  endDate?: string;
}

export class PurchaseReceiptRepository extends BaseRepository<
  PurchaseReceipt,
  CreatePurchaseReceiptInput,
  UpdatePurchaseReceiptInput,
  PurchaseReceiptFilterParams
> {
  protected readonly tableName = 'purchase_receipts';
  protected readonly allowedSortFields = [
    'receipt_number',
    'receipt_date',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  async create(data: CreatePurchaseReceiptInput, client?: PoolClient): Promise<PurchaseReceipt> {
    const rows = await query<PurchaseReceipt>(
      `INSERT INTO purchase_receipts (
         organization_id, purchase_order_id, receipt_number, warehouse_id,
         status, receipt_date, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.purchase_order_id,
        data.receipt_number,
        data.warehouse_id,
        data.status || 'draft',
        data.receipt_date || new Date(),
        data.notes || null,
        data.created_by || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<PurchaseReceipt | null> {
    return queryOne<PurchaseReceipt>(
      'SELECT * FROM purchase_receipts WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<PurchaseReceipt | null> {
    return queryOne<PurchaseReceipt>(
      'SELECT * FROM purchase_receipts WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async findByReceiptNumber(
    organizationId: string,
    receiptNumber: string,
    client?: PoolClient,
  ): Promise<PurchaseReceipt | null> {
    return queryOne<PurchaseReceipt>(
      'SELECT * FROM purchase_receipts WHERE receipt_number = $1 AND organization_id = $2;',
      [receiptNumber, organizationId],
      client,
    );
  }

  async findByPurchaseOrderId(
    organizationId: string,
    purchaseOrderId: string,
    client?: PoolClient,
  ): Promise<PurchaseReceipt[]> {
    return query<PurchaseReceipt>(
      'SELECT * FROM purchase_receipts WHERE purchase_order_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [purchaseOrderId, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePurchaseReceiptInput,
    client?: PoolClient,
  ): Promise<PurchaseReceipt | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.warehouse_id !== undefined) {
      fields.push(`warehouse_id = $${idx++}`);
      values.push(data.warehouse_id);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.receipt_date !== undefined) {
      fields.push(`receipt_date = $${idx++}`);
      values.push(data.receipt_date);
    }
    if (data.received_at !== undefined) {
      fields.push(`received_at = $${idx++}`);
      values.push(data.received_at);
    }
    if (data.cancelled_at !== undefined) {
      fields.push(`cancelled_at = $${idx++}`);
      values.push(data.cancelled_at);
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
    const sql = `UPDATE purchase_receipts SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<PurchaseReceipt>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: PurchaseReceiptFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(receipt_number ILIKE $${idx} OR notes ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.purchaseOrderId) {
      conditions.push(`purchase_order_id = $${idx++}`);
      values.push(params.purchaseOrderId);
    }

    if (params?.warehouseId) {
      conditions.push(`warehouse_id = $${idx++}`);
      values.push(params.warehouseId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.startDate) {
      conditions.push(`receipt_date >= $${idx++}`);
      values.push(params.startDate);
    }

    if (params?.endDate) {
      conditions.push(`receipt_date <= $${idx++}`);
      values.push(params.endDate);
    }

    return { conditions, values };
  }

  async listReceipts(
    organizationId: string,
    params?: PurchaseReceiptFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<PurchaseReceipt>> {
    return this.listByOrganization(organizationId, params, client);
  }

  // Receipt Item Operations
  async createItem(
    data: CreatePurchaseReceiptItemInput,
    client?: PoolClient,
  ): Promise<PurchaseReceiptItem> {
    const rows = await query<PurchaseReceiptItem>(
      `INSERT INTO purchase_receipt_items (
         organization_id, receipt_id, purchase_order_item_id, product_id, quantity, unit_cost
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        data.organization_id,
        data.receipt_id,
        data.purchase_order_item_id,
        data.product_id,
        String(data.quantity),
        data.unit_cost !== undefined ? String(data.unit_cost) : '0.0000',
      ],
      client,
    );
    return rows[0]!;
  }

  async findItemById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<PurchaseReceiptItem | null> {
    return queryOne<PurchaseReceiptItem>(
      'SELECT * FROM purchase_receipt_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    receiptId: string,
    client?: PoolClient,
  ): Promise<PurchaseReceiptItem[]> {
    return query<PurchaseReceiptItem>(
      'SELECT * FROM purchase_receipt_items WHERE receipt_id = $1 AND organization_id = $2 ORDER BY created_at ASC;',
      [receiptId, organizationId],
      client,
    );
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdatePurchaseReceiptItemInput,
    client?: PoolClient,
  ): Promise<PurchaseReceiptItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(String(data.quantity));
    }
    if (data.unit_cost !== undefined) {
      fields.push(`unit_cost = $${idx++}`);
      values.push(String(data.unit_cost));
    }

    if (fields.length === 0) {
      return this.findItemById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE purchase_receipt_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<PurchaseReceiptItem>(sql, values, client);
  }

  async deleteItem(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM purchase_receipt_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }

  /**
   * Sums all posted & completed receipt quantities for a given Purchase Order Item.
   */
  async getReceivedQuantityForPurchaseOrderItem(
    organizationId: string,
    purchaseOrderItemId: string,
    client?: PoolClient,
  ): Promise<string> {
    const row = await queryOne<{ total_received: string }>(
      `SELECT COALESCE(SUM(pri.quantity), 0)::text AS total_received
       FROM purchase_receipt_items pri
       JOIN purchase_receipts pr ON pr.id = pri.receipt_id
       WHERE pri.organization_id = $1
         AND pri.purchase_order_item_id = $2
         AND pr.status IN ('posted', 'completed');`,
      [organizationId, purchaseOrderItemId],
      client,
    );
    return row?.total_received || '0.0000';
  }
}

export const purchaseReceiptRepository = new PurchaseReceiptRepository();
