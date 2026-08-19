import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface CustomerFilterParams extends BaseFilterParams {
  query?: string;
  status?: string;
}

export class CustomerRepository extends BaseRepository<
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilterParams
> {
  protected readonly tableName = 'customers';
  protected readonly allowedSortFields = ['name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
  protected readonly defaultSortBy = 'name';
  protected readonly isOrganizationScoped = true;

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
    const sql = `UPDATE customers SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Customer>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: CustomerFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }

  async search(
    organizationId: string,
    searchParams: CustomerFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Customer>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }
}

export const customerRepository = new CustomerRepository();
