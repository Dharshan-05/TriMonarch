import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface SupplierFilterParams extends BaseFilterParams {
  query?: string;
  status?: string;
}

export class SupplierRepository extends BaseRepository<
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierFilterParams
> {
  protected readonly tableName = 'suppliers';
  protected readonly allowedSortFields = ['name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
  protected readonly defaultSortBy = 'name';
  protected readonly isOrganizationScoped = true;

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
    const sql = `UPDATE suppliers SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Supplier>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: SupplierFilterParams,
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
    searchParams: SupplierFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Supplier>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }
}

export const supplierRepository = new SupplierRepository();
