import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  CreatePurchaseOrderItemInput,
  UpdatePurchaseOrderItemInput,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface PurchaseOrderFilterParams extends BaseFilterParams {
  query?: string;
  supplierId?: string;
  warehouseId?: string;
  status?: string;
  orderDate?: Date | string;
  expectedDeliveryDate?: Date | string;
}

export class PurchaseOrderRepository extends BaseRepository<
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderFilterParams
> {
  protected readonly tableName = 'purchase_orders';
  protected readonly allowedSortFields = [
    'order_number',
    'order_date',
    'expected_delivery_date',
    'status',
    'total_amount',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'order_number';
  protected readonly isOrganizationScoped = true;

  async create(data: CreatePurchaseOrderInput, client?: PoolClient): Promise<PurchaseOrder> {
    const rows = await query<PurchaseOrder>(
      `INSERT INTO purchase_orders (
         organization_id, supplier_id, warehouse_id, order_number, order_date, expected_delivery_date, status,
         currency, subtotal, tax_amount, discount_amount, total_amount, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *;`,
      [
        data.organization_id,
        data.supplier_id,
        data.warehouse_id || null,
        data.order_number,
        data.order_date || new Date(),
        data.expected_delivery_date || null,
        data.status || 'draft',
        data.currency || 'USD',
        data.subtotal !== undefined ? String(data.subtotal) : '0.0000',
        data.tax_amount !== undefined ? String(data.tax_amount) : '0.0000',
        data.discount_amount !== undefined ? String(data.discount_amount) : '0.0000',
        data.total_amount !== undefined ? String(data.total_amount) : '0.0000',
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<PurchaseOrder | null> {
    return queryOne<PurchaseOrder>(
      'SELECT * FROM purchase_orders WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<PurchaseOrder | null> {
    return queryOne<PurchaseOrder>(
      'SELECT * FROM purchase_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async findByOrderNumber(
    organizationId: string,
    orderNumber: string,
    client?: PoolClient,
  ): Promise<PurchaseOrder | null> {
    return queryOne<PurchaseOrder>(
      'SELECT * FROM purchase_orders WHERE order_number = $1 AND organization_id = $2;',
      [orderNumber, organizationId],
      client,
    );
  }

  async findBySupplierId(
    organizationId: string,
    supplierId: string,
    client?: PoolClient,
  ): Promise<PurchaseOrder[]> {
    return query<PurchaseOrder>(
      'SELECT * FROM purchase_orders WHERE supplier_id = $1 AND organization_id = $2 ORDER BY order_date DESC;',
      [supplierId, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePurchaseOrderInput,
    client?: PoolClient,
  ): Promise<PurchaseOrder | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.supplier_id !== undefined) {
      fields.push(`supplier_id = $${idx++}`);
      values.push(data.supplier_id);
    }
    if (data.warehouse_id !== undefined) {
      fields.push(`warehouse_id = $${idx++}`);
      values.push(data.warehouse_id);
    }
    if (data.order_number !== undefined) {
      fields.push(`order_number = $${idx++}`);
      values.push(data.order_number);
    }
    if (data.order_date !== undefined) {
      fields.push(`order_date = $${idx++}`);
      values.push(data.order_date);
    }
    if (data.expected_delivery_date !== undefined) {
      fields.push(`expected_delivery_date = $${idx++}`);
      values.push(data.expected_delivery_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.currency !== undefined) {
      fields.push(`currency = $${idx++}`);
      values.push(data.currency);
    }
    if (data.subtotal !== undefined) {
      fields.push(`subtotal = $${idx++}`);
      values.push(String(data.subtotal));
    }
    if (data.tax_amount !== undefined) {
      fields.push(`tax_amount = $${idx++}`);
      values.push(String(data.tax_amount));
    }
    if (data.discount_amount !== undefined) {
      fields.push(`discount_amount = $${idx++}`);
      values.push(String(data.discount_amount));
    }
    if (data.total_amount !== undefined) {
      fields.push(`total_amount = $${idx++}`);
      values.push(String(data.total_amount));
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE purchase_orders SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<PurchaseOrder>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: PurchaseOrderFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(order_number ILIKE $${idx} OR notes ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.supplierId) {
      conditions.push(`supplier_id = $${idx++}`);
      values.push(params.supplierId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.orderDate) {
      conditions.push(`DATE(order_date) = DATE($${idx++})`);
      values.push(params.orderDate);
    }

    if (params?.expectedDeliveryDate) {
      conditions.push(`DATE(expected_delivery_date) = DATE($${idx++})`);
      values.push(params.expectedDeliveryDate);
    }

    return { conditions, values };
  }

  async search(
    organizationId: string,
    searchParams: PurchaseOrderFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }

  // Item Operations
  async createItem(data: CreatePurchaseOrderItemInput, client?: PoolClient): Promise<PurchaseOrderItem> {
    const rows = await query<PurchaseOrderItem>(
      `INSERT INTO purchase_order_items (
         organization_id, purchase_order_id, product_id, quantity,
         unit_cost, discount_amount, tax_rate, tax_amount, line_total, sequence
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        data.organization_id,
        data.purchase_order_id,
        data.product_id,
        data.quantity !== undefined ? String(data.quantity) : '1.0000',
        data.unit_cost !== undefined ? String(data.unit_cost) : '0.0000',
        data.discount_amount !== undefined ? String(data.discount_amount) : '0.0000',
        data.tax_rate !== undefined ? String(data.tax_rate) : '0.000000',
        data.tax_amount !== undefined ? String(data.tax_amount) : '0.0000',
        data.line_total !== undefined ? String(data.line_total) : '0.0000',
        data.sequence !== undefined ? data.sequence : 1,
      ],
      client,
    );
    return rows[0]!;
  }

  async findItemById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<PurchaseOrderItem | null> {
    return queryOne<PurchaseOrderItem>(
      'SELECT * FROM purchase_order_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    purchaseOrderId: string,
    client?: PoolClient,
  ): Promise<PurchaseOrderItem[]> {
    return query<PurchaseOrderItem>(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 AND organization_id = $2 ORDER BY sequence ASC;',
      [purchaseOrderId, organizationId],
      client,
    );
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdatePurchaseOrderItemInput,
    client?: PoolClient,
  ): Promise<PurchaseOrderItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.product_id !== undefined) {
      fields.push(`product_id = $${idx++}`);
      values.push(data.product_id);
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
    if (data.sequence !== undefined) {
      fields.push(`sequence = $${idx++}`);
      values.push(data.sequence);
    }

    if (fields.length === 0) {
      return this.findItemById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE purchase_order_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<PurchaseOrderItem>(sql, values, client);
  }

  async deleteItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM purchase_order_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
