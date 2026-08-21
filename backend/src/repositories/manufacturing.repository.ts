import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  ManufacturingOrder,
  ManufacturingOrderItem,
  ManufacturingOrderStatusHistory,
  CreateManufacturingOrderInput,
  UpdateManufacturingOrderInput,
  CreateManufacturingOrderItemInput,
  UpdateManufacturingOrderItemInput,
  CreateManufacturingOrderStatusHistoryInput,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface ManufacturingOrderFilterParams extends BaseFilterParams {
  query?: string;
  bomId?: string;
  bom_id?: string;
  productId?: string;
  product_id?: string;
  warehouseId?: string;
  warehouse_id?: string;
  status?: string;
  priority?: string;
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
    'mo_number',
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
    const orderNumber = data.order_number || data.mo_number || `MO-${Date.now()}`;
    const moNumber = data.mo_number || orderNumber;

    const rows = await query<ManufacturingOrder>(
      `INSERT INTO manufacturing_orders (
         organization_id, bom_id, product_id, warehouse_id, order_number, mo_number,
         planned_quantity, completed_quantity, scheduled_start_date, scheduled_end_date,
         actual_start_date, actual_end_date, status, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *;`,
      [
        data.organization_id,
        data.bom_id,
        data.product_id,
        data.warehouse_id || null,
        orderNumber,
        moNumber,
        data.planned_quantity !== undefined ? String(data.planned_quantity) : '1.0000',
        data.completed_quantity !== undefined ? String(data.completed_quantity) : '0.0000',
        data.scheduled_start_date || data.planned_start_date || null,
        data.scheduled_end_date || data.planned_end_date || null,
        data.actual_start_date || null,
        data.actual_end_date || null,
        data.status || 'draft',
        data.notes || null,
        data.created_by || null,
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

  async findByIdWithItems(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<(ManufacturingOrder & { items: ManufacturingOrderItem[] }) | null> {
    const mo = await this.findById(organizationId, id, client);
    if (!mo) return null;

    const items = await this.listItems(organizationId, id, client);
    return {
      ...mo,
      items,
    };
  }

  async findByOrderNumber(
    organizationId: string,
    orderNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder | null> {
    return queryOne<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE (order_number = $1 OR mo_number = $1) AND organization_id = $2;',
      [orderNumber, organizationId],
      client,
    );
  }

  async findByMoNumber(
    organizationId: string,
    moNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder | null> {
    return this.findByOrderNumber(organizationId, moNumber, client);
  }

  async findByWarehouseId(
    organizationId: string,
    warehouseId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder[]> {
    return query<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE warehouse_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [warehouseId, organizationId],
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

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrder | null> {
    return queryOne<ManufacturingOrder>(
      'SELECT * FROM manufacturing_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
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
    if (data.warehouse_id !== undefined) {
      fields.push(`warehouse_id = $${idx++}`);
      values.push(data.warehouse_id);
    }
    if (data.order_number !== undefined) {
      fields.push(`order_number = $${idx++}`);
      values.push(data.order_number);
    }
    if (data.mo_number !== undefined) {
      fields.push(`mo_number = $${idx++}`);
      values.push(data.mo_number);
    }
    if (data.planned_quantity !== undefined) {
      fields.push(`planned_quantity = $${idx++}`);
      values.push(String(data.planned_quantity));
    }
    if (data.completed_quantity !== undefined) {
      fields.push(`completed_quantity = $${idx++}`);
      values.push(String(data.completed_quantity));
    }
    if (data.produced_quantity !== undefined) {
      fields.push(`produced_quantity = $${idx++}`);
      values.push(String(data.produced_quantity));
    }
    const schedStart = data.scheduled_start_date !== undefined ? data.scheduled_start_date : data.planned_start_date;
    if (schedStart !== undefined) {
      fields.push(`scheduled_start_date = $${idx++}`);
      values.push(schedStart);
    }
    const schedEnd = data.scheduled_end_date !== undefined ? data.scheduled_end_date : data.planned_end_date;
    if (schedEnd !== undefined) {
      fields.push(`scheduled_end_date = $${idx++}`);
      values.push(schedEnd);
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
    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${idx++}`);
      values.push(data.updated_by);
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
      conditions.push(`(order_number ILIKE $${idx} OR mo_number ILIKE $${idx} OR notes ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    const bId = params?.bom_id || params?.bomId;
    if (bId) {
      conditions.push(`bom_id = $${idx++}`);
      values.push(bId);
    }

    const pId = params?.product_id || params?.productId;
    if (pId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(pId);
    }

    const wId = params?.warehouse_id || params?.warehouseId;
    if (wId) {
      conditions.push(`warehouse_id = $${idx++}`);
      values.push(wId);
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

  async listOrders(
    organizationId: string,
    params?: ManufacturingOrderFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.listByOrganization(organizationId, params, client);
  }

  async search(
    organizationId: string,
    searchParams: ManufacturingOrderFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }

  // Item / Component Operations
  async createItem(data: CreateManufacturingOrderItemInput, client?: PoolClient): Promise<ManufacturingOrderItem> {
    const rows = await query<ManufacturingOrderItem>(
      `INSERT INTO manufacturing_order_items (
         organization_id, manufacturing_order_id, component_product_id, bom_item_id,
         required_quantity, consumed_quantity, unit, sequence, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        data.notes || null,
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
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
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

  async deleteItemsByOrderId(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<void> {
    await query(
      'DELETE FROM manufacturing_order_items WHERE manufacturing_order_id = $1 AND organization_id = $2;',
      [manufacturingOrderId, organizationId],
      client,
    );
  }

  // Status History Operations
  async createStatusHistory(
    data: CreateManufacturingOrderStatusHistoryInput,
    client?: PoolClient,
  ): Promise<ManufacturingOrderStatusHistory> {
    const rows = await query<ManufacturingOrderStatusHistory>(
      `INSERT INTO manufacturing_order_status_history (
         organization_id, manufacturing_order_id, from_status, to_status,
         changed_by, reason, request_id, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.from_status,
        data.to_status,
        data.changed_by || null,
        data.reason || null,
        data.request_id || null,
        JSON.stringify(data.metadata || {}),
      ],
      client,
    );
    return rows[0]!;
  }

  async listStatusHistory(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ManufacturingOrderStatusHistory[]> {
    return query<ManufacturingOrderStatusHistory>(
      `SELECT * FROM manufacturing_order_status_history
       WHERE manufacturing_order_id = $1 AND organization_id = $2
       ORDER BY created_at ASC;`,
      [manufacturingOrderId, organizationId],
      client,
    );
  }
}

export const manufacturingRepository = new ManufacturingRepository();
