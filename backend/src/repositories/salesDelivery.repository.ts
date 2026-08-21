import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  SalesDelivery,
  CreateSalesDeliveryInput,
  UpdateSalesDeliveryInput,
  SalesDeliveryItem,
  CreateSalesDeliveryItemInput,
  SalesDeliveryStatus,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface SalesDeliveryFilterParams extends BaseFilterParams {
  query?: string;
  salesOrderId?: string;
  warehouseId?: string;
  status?: SalesDeliveryStatus;
}

export class SalesDeliveryRepository extends BaseRepository<
  SalesDelivery,
  CreateSalesDeliveryInput,
  UpdateSalesDeliveryInput,
  SalesDeliveryFilterParams
> {
  protected readonly tableName = 'sales_deliveries';
  protected readonly allowedSortFields = [
    'id',
    'delivery_number',
    'delivery_date',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateSalesDeliveryInput, client?: PoolClient): Promise<SalesDelivery> {
    const rows = await query<SalesDelivery>(
      `INSERT INTO sales_deliveries (
         organization_id, sales_order_id, delivery_number, warehouse_id,
         status, delivery_date, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.sales_order_id,
        data.delivery_number,
        data.warehouse_id,
        data.status || 'draft',
        data.delivery_date ? new Date(data.delivery_date) : new Date(),
        data.notes || null,
        data.created_by || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async createDelivery(data: CreateSalesDeliveryInput, client?: PoolClient): Promise<SalesDelivery> {
    return this.create(data, client);
  }

  async getDeliveryById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SalesDelivery | null> {
    return this.findById(organizationId, id, client);
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SalesDelivery | null> {
    return queryOne<SalesDelivery>(
      'SELECT * FROM sales_deliveries WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async getDeliveryByNumber(
    organizationId: string,
    deliveryNumber: string,
    client?: PoolClient,
  ): Promise<SalesDelivery | null> {
    return queryOne<SalesDelivery>(
      'SELECT * FROM sales_deliveries WHERE delivery_number = $1 AND organization_id = $2;',
      [deliveryNumber, organizationId],
      client,
    );
  }

  async listDeliveries(
    organizationId: string,
    params?: SalesDeliveryFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<SalesDelivery>> {
    return this.listByOrganization(organizationId, params, client);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateSalesDeliveryInput,
    client?: PoolClient,
  ): Promise<SalesDelivery | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.warehouse_id !== undefined) {
      fields.push(`warehouse_id = $${idx++}`);
      values.push(data.warehouse_id);
    }
    if (data.delivery_date !== undefined) {
      fields.push(`delivery_date = $${idx++}`);
      values.push(data.delivery_date ? new Date(data.delivery_date) : new Date());
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.shipped_at !== undefined) {
      fields.push(`shipped_at = $${idx++}`);
      values.push(data.shipped_at ? new Date(data.shipped_at) : null);
    }
    if (data.delivered_at !== undefined) {
      fields.push(`delivered_at = $${idx++}`);
      values.push(data.delivered_at ? new Date(data.delivered_at) : null);
    }
    if (data.cancelled_at !== undefined) {
      fields.push(`cancelled_at = $${idx++}`);
      values.push(data.cancelled_at ? new Date(data.cancelled_at) : null);
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

    fields.push(`updated_at = NOW()`);

    values.push(id, organizationId);
    const sql = `UPDATE sales_deliveries SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<SalesDelivery>(sql, values, client);
  }

  async updateDelivery(
    organizationId: string,
    id: string,
    data: UpdateSalesDeliveryInput,
    client?: PoolClient,
  ): Promise<SalesDelivery | null> {
    return this.update(organizationId, id, data, client);
  }

  async getDeliveriesBySalesOrder(
    organizationId: string,
    salesOrderId: string,
    client?: PoolClient,
  ): Promise<SalesDelivery[]> {
    return query<SalesDelivery>(
      'SELECT * FROM sales_deliveries WHERE sales_order_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [salesOrderId, organizationId],
      client,
    );
  }

  async getDeliveriesByWarehouse(
    organizationId: string,
    warehouseId: string,
    client?: PoolClient,
  ): Promise<SalesDelivery[]> {
    return query<SalesDelivery>(
      'SELECT * FROM sales_deliveries WHERE warehouse_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [warehouseId, organizationId],
      client,
    );
  }

  // Delivery Items Operations
  async createDeliveryItem(
    data: CreateSalesDeliveryItemInput,
    client?: PoolClient,
  ): Promise<SalesDeliveryItem> {
    const rows = await query<SalesDeliveryItem>(
      `INSERT INTO sales_delivery_items (
         organization_id, delivery_id, sales_order_item_id, product_id, quantity
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.organization_id,
        data.delivery_id,
        data.sales_order_item_id,
        data.product_id,
        String(data.quantity),
      ],
      client,
    );
    return rows[0]!;
  }

  async getDeliveryItems(
    organizationId: string,
    deliveryId: string,
    client?: PoolClient,
  ): Promise<SalesDeliveryItem[]> {
    return query<SalesDeliveryItem>(
      'SELECT * FROM sales_delivery_items WHERE delivery_id = $1 AND organization_id = $2 ORDER BY created_at ASC;',
      [deliveryId, organizationId],
      client,
    );
  }

  async getDeliveryItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SalesDeliveryItem | null> {
    return queryOne<SalesDeliveryItem>(
      'SELECT * FROM sales_delivery_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async deleteDeliveryItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM sales_delivery_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }

  /**
   * Sums quantities across non-cancelled deliveries for a given Sales Order Item.
   */
  async getDeliveredQuantityForSalesOrderItem(
    organizationId: string,
    salesOrderItemId: string,
    client?: PoolClient,
  ): Promise<string> {
    const result = await queryOne<{ total_delivered: string }>(
      `SELECT COALESCE(SUM(sdi.quantity), 0) AS total_delivered
       FROM sales_delivery_items sdi
       JOIN sales_deliveries sd ON sdi.delivery_id = sd.id
       WHERE sdi.sales_order_item_id = $1
         AND sdi.organization_id = $2
         AND sd.status != 'cancelled';`,
      [salesOrderItemId, organizationId],
      client,
    );
    return result ? String(result.total_delivered) : '0.0000';
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: SalesDeliveryFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(delivery_number ILIKE $${idx} OR notes ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.salesOrderId) {
      conditions.push(`sales_order_id = $${idx++}`);
      values.push(params.salesOrderId);
    }

    if (params?.warehouseId) {
      conditions.push(`warehouse_id = $${idx++}`);
      values.push(params.warehouseId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }
}

export const salesDeliveryRepository = new SalesDeliveryRepository();
