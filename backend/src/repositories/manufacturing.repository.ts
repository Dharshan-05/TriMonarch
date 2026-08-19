import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  ManufacturingOrder,
  ManufacturingOrderItem,
  CreateManufacturingOrderInput,
  UpdateManufacturingOrderInput,
  CreateManufacturingOrderItemInput,
  UpdateManufacturingOrderItemInput,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface ManufacturingOrderFilterParams extends BaseFilterParams {
  query?: string;
  bomId?: string;
  productId?: string;
  status?: string;
  scheduledStartDate?: Date | string;
  scheduledEndDate?: Date | string;
}

export class ManufacturingRepository extends BaseRepository<
  ManufacturingOrder,
  CreateManufacturingOrderInput,
  UpdateManufacturingOrderInput,
  ManufacturingOrderFilterParams
> {
  protected readonly tableName = 'manufacturing_orders';
  protected readonly allowedSortFields = [
    'order_number',
    'planned_quantity',
    'completed_quantity',
    'scheduled_start_date',
    'scheduled_end_date',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'order_number';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateManufacturingOrderInput, client?: PoolClient): Promise<ManufacturingOrder> {
    const rows = await query<ManufacturingOrder>(
      `INSERT INTO manufacturing_orders (
         organization_id, bom_id, product_id, order_number, planned_quantity, completed_quantity,
         scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, status, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *;`,
      [
        data.organization_id,
        data.bom_id,
        data.product_id,
        data.order_number,
        data.planned_quantity !== undefined ? String(data.planned_quantity) : '1.0000',
        data.completed_quantity !== undefined ? String(data.completed_quantity) : '0.0000',
        data.scheduled_start_date || null,
        data.scheduled_end_date || null,
        data.actual_start_date || null,
        data.actual_end_date || null,
        data.status || 'draft',
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<ManufacturingOrder | null> {
    return queryOne<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByOrderNumber(
    organizationId: string,
    orderNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder | null> {
    return queryOne<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE order_number = $1 AND organization_id = $2;',
      [orderNumber, organizationId],
      client,
    );
  }

  async findByBomId(
    organizationId: string,
    bomId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder[]> {
    return query<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE bom_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [bomId, organizationId],
      client,
    );
  }

  async findByProductId(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder[]> {
    return query<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE product_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [productId, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateManufacturingOrderInput,
    client?: PoolClient,
  ): Promise<ManufacturingOrder | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.bom_id !== undefined) {
      fields.push(`bom_id = $${idx++}`);
      values.push(data.bom_id);
    }
    if (data.product_id !== undefined) {
      fields.push(`product_id = $${idx++}`);
      values.push(data.product_id);
    }
    if (data.planned_quantity !== undefined) {
      fields.push(`planned_quantity = $${idx++}`);
      values.push(String(data.planned_quantity));
    }
    if (data.completed_quantity !== undefined) {
      fields.push(`completed_quantity = $${idx++}`);
      values.push(String(data.completed_quantity));
    }
    if (data.scheduled_start_date !== undefined) {
      fields.push(`scheduled_start_date = $${idx++}`);
      values.push(data.scheduled_start_date);
    }
    if (data.scheduled_end_date !== undefined) {
      fields.push(`scheduled_end_date = $${idx++}`);
      values.push(data.scheduled_end_date);
    }
    if (data.actual_start_date !== undefined) {
      fields.push(`actual_start_date = $${idx++}`);
      values.push(data.actual_start_date);
    }
    if (data.actual_end_date !== undefined) {
      fields.push(`actual_end_date = $${idx++}`);
      values.push(data.actual_end_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE manufacturing_orders SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<ManufacturingOrder>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: ManufacturingOrderFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(order_number ILIKE $${idx} OR notes ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.bomId) {
      conditions.push(`bom_id = $${idx++}`);
      values.push(params.bomId);
    }

    if (params?.productId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(params.productId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.scheduledStartDate) {
      conditions.push(`DATE(scheduled_start_date) = DATE($${idx++})`);
      values.push(params.scheduledStartDate);
    }

    if (params?.scheduledEndDate) {
      conditions.push(`DATE(scheduled_end_date) = DATE($${idx++})`);
      values.push(params.scheduledEndDate);
    }

    return { conditions, values };
  }

  async search(
    organizationId: string,
    searchParams: ManufacturingOrderFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }

  // Item Operations
  async createItem(data: CreateManufacturingOrderItemInput, client?: PoolClient): Promise<ManufacturingOrderItem> {
    const rows = await query<ManufacturingOrderItem>(
      `INSERT INTO manufacturing_order_items (
         organization_id, manufacturing_order_id, component_product_id, bom_item_id,
         required_quantity, consumed_quantity, unit, sequence
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.component_product_id,
        data.bom_item_id || null,
        data.required_quantity !== undefined ? String(data.required_quantity) : '1.0000',
        data.consumed_quantity !== undefined ? String(data.consumed_quantity) : '0.0000',
        data.unit || 'pcs',
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
  ): Promise<ManufacturingOrderItem | null> {
    return queryOne<ManufacturingOrderItem>(
      'SELECT * FROM manufacturing_order_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrderItem[]> {
    return query<ManufacturingOrderItem>(
      'SELECT * FROM manufacturing_order_items WHERE manufacturing_order_id = $1 AND organization_id = $2 ORDER BY sequence ASC;',
      [manufacturingOrderId, organizationId],
      client,
    );
  }

  async listItemsByProduct(
    organizationId: string,
    componentProductId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrderItem[]> {
    return query<ManufacturingOrderItem>(
      'SELECT * FROM manufacturing_order_items WHERE component_product_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [componentProductId, organizationId],
      client,
    );
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdateManufacturingOrderItemInput,
    client?: PoolClient,
  ): Promise<ManufacturingOrderItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.component_product_id !== undefined) {
      fields.push(`component_product_id = $${idx++}`);
      values.push(data.component_product_id);
    }
    if (data.bom_item_id !== undefined) {
      fields.push(`bom_item_id = $${idx++}`);
      values.push(data.bom_item_id);
    }
    if (data.required_quantity !== undefined) {
      fields.push(`required_quantity = $${idx++}`);
      values.push(String(data.required_quantity));
    }
    if (data.consumed_quantity !== undefined) {
      fields.push(`consumed_quantity = $${idx++}`);
      values.push(String(data.consumed_quantity));
    }
    if (data.unit !== undefined) {
      fields.push(`unit = $${idx++}`);
      values.push(data.unit);
    }
    if (data.sequence !== undefined) {
      fields.push(`sequence = $${idx++}`);
      values.push(data.sequence);
    }

    if (fields.length === 0) {
      return this.findItemById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE manufacturing_order_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<ManufacturingOrderItem>(sql, values, client);
  }

  async deleteItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM manufacturing_order_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const manufacturingRepository = new ManufacturingRepository();
