import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class OrganizationRepository {
  async create(data: CreateOrganizationInput, client?: PoolClient): Promise<Organization> {
    const rows = await query<Organization>(
      `INSERT INTO organizations (name, code, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [data.name, data.code, data.description || null, data.status || 'active'],
      client,
    );
    return rows[0]!;
  }

  async findById(id: string, client?: PoolClient): Promise<Organization | null> {
    return queryOne<Organization>('SELECT * FROM organizations WHERE id = $1;', [id], client);
  }

  async findByCode(code: string, client?: PoolClient): Promise<Organization | null> {
    return queryOne<Organization>('SELECT * FROM organizations WHERE code = $1;', [code], client);
  }

  async list(params?: PaginationParams, client?: PoolClient): Promise<PaginatedResult<Organization>> {
    const countRes = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM organizations;',
      [],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['name', 'code', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Organization>(
      `SELECT * FROM organizations ${pagination.sql};`,
      [],
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async update(
    id: string,
    data: UpdateOrganizationInput,
    client?: PoolClient,
  ): Promise<Organization | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const sql = `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    return queryOne<Organization>(sql, values, client);
  }

  async delete(id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM organizations WHERE id = $1 RETURNING id;',
      [id],
      client,
    );
    return rows.length > 0;
  }
}

export const organizationRepository = new OrganizationRepository();
