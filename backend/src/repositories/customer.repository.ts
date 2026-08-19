import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class CustomerRepository {
  async create(data: CreateCustomerInput, client?: PoolClient): Promise<Customer> {
    const rows = await query<Customer>(
      `INSERT INTO customers (organization_id, name, email, phone, address, status)
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

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Customer | null> {
    return queryOne<Customer>(
      'SELECT * FROM customers WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async search(
    organizationId: string,
    searchParams: { query?: string; status?: string } & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Customer>> {
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
      `SELECT COUNT(*) as count FROM customers ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params: searchParams,
      allowedSortFields: ['name', 'email', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Customer>(
      `SELECT * FROM customers ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Customer>> {
    return this.search(organizationId, { ...params }, client);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateCustomerInput,
    client?: PoolClient,
  ): Promise<Customer | null> {
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
    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Customer>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM customers WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const customerRepository = new CustomerRepository();
