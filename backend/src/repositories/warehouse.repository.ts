import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class WarehouseRepository {
  async create(data: CreateWarehouseInput, client?: PoolClient): Promise<Warehouse> {
    const rows = await query<Warehouse>(
      `INSERT INTO warehouses (organization_id, name, code, location, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.organization_id,
        data.name,
        data.code,
        data.location || null,
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Warehouse | null> {
    return queryOne<Warehouse>(
      'SELECT * FROM warehouses WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByCode(organizationId: string, code: string, client?: PoolClient): Promise<Warehouse | null> {
    return queryOne<Warehouse>(
      'SELECT * FROM warehouses WHERE code = $1 AND organization_id = $2;',
      [code, organizationId],
      client,
    );
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Warehouse>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];

    if (params?.status) {
      conditions.push('status = $2');
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM warehouses ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['name', 'code', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Warehouse>(
      `SELECT * FROM warehouses ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateWarehouseInput,
    client?: PoolClient,
  ): Promise<Warehouse | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.location !== undefined) {
      fields.push(`location = $${idx++}`);
      values.push(data.location);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE warehouses SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Warehouse>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM warehouses WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const warehouseRepository = new WarehouseRepository();
