import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class SupplierRepository {
  async create(data: CreateSupplierInput, client?: PoolClient): Promise<Supplier> {
    const rows = await query<Supplier>(
      `INSERT INTO suppliers (organization_id, name, email, phone, address, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        data.organization_id,
        data.name,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Supplier | null> {
    return queryOne<Supplier>(
      'SELECT * FROM suppliers WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async search(
    organizationId: string,
    searchParams: { query?: string; status?: string } & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Supplier>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (searchParams.query) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
      values.push(`%${searchParams.query}%`);
      idx++;
    }

    if (searchParams.status) {
      conditions.push(`status = $${idx++}`);
      values.push(searchParams.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM suppliers ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params: searchParams,
      allowedSortFields: ['name', 'email', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Supplier>(
      `SELECT * FROM suppliers ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Supplier>> {
    return this.search(organizationId, { ...params }, client);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateSupplierInput,
    client?: PoolClient,
  ): Promise<Supplier | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(data.address);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Supplier>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM suppliers WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const supplierRepository = new SupplierRepository();
