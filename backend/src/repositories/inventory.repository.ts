import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Inventory, CreateInventoryInput, UpdateInventoryInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class InventoryRepository {
  async create(data: CreateInventoryInput, client?: PoolClient): Promise<Inventory> {
    const rows = await query<Inventory>(
      `INSERT INTO inventory (organization_id, product_id, warehouse_id, quantity, reorder_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.organization_id,
        data.product_id,
        data.warehouse_id,
        data.quantity ?? 0,
        data.reorder_level ?? 0,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Inventory | null> {
    return queryOne<Inventory>(
      'SELECT * FROM inventory WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByProduct(organizationId: string, productId: string, client?: PoolClient): Promise<Inventory[]> {
    return query<Inventory>(
      'SELECT * FROM inventory WHERE product_id = $1 AND organization_id = $2;',
      [productId, organizationId],
      client,
    );
  }

  async findByWarehouse(organizationId: string, warehouseId: string, client?: PoolClient): Promise<Inventory[]> {
    return query<Inventory>(
      'SELECT * FROM inventory WHERE warehouse_id = $1 AND organization_id = $2;',
      [warehouseId, organizationId],
      client,
    );
  }

  async findByProductAndWarehouse(
    organizationId: string,
    productId: string,
    warehouseId: string,
    client?: PoolClient,
  ): Promise<Inventory | null> {
    return queryOne<Inventory>(
      'SELECT * FROM inventory WHERE product_id = $1 AND warehouse_id = $2 AND organization_id = $3;',
      [productId, warehouseId, organizationId],
      client,
    );
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Inventory>> {
    const countRes = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM inventory WHERE organization_id = $1;',
      [organizationId],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['quantity', 'reorder_level', 'created_at'],
      defaultSortBy: 'created_at',
    });

    const items = await query<Inventory>(
      `SELECT * FROM inventory WHERE organization_id = $1 ${pagination.sql};`,
      [organizationId],
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async updateQuantity(
    organizationId: string,
    id: string,
    quantity: number,
    client?: PoolClient,
  ): Promise<Inventory | null> {
    return queryOne<Inventory>(
      'UPDATE inventory SET quantity = $1 WHERE id = $2 AND organization_id = $3 RETURNING *;',
      [quantity, id, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateInventoryInput,
    client?: PoolClient,
  ): Promise<Inventory | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(data.quantity);
    }
    if (data.reorder_level !== undefined) {
      fields.push(`reorder_level = $${idx++}`);
      values.push(data.reorder_level);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE inventory SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Inventory>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM inventory WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const inventoryRepository = new InventoryRepository();
