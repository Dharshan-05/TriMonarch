import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Department, CreateDepartmentInput, UpdateDepartmentInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class DepartmentRepository {
  async create(data: CreateDepartmentInput, client?: PoolClient): Promise<Department> {
    const rows = await query<Department>(
      `INSERT INTO departments (organization_id, name, code, description, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.organization_id,
        data.name,
        data.code,
        data.description || null,
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Department | null> {
    return queryOne<Department>(
      'SELECT * FROM departments WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByCode(organizationId: string, code: string, client?: PoolClient): Promise<Department | null> {
    return queryOne<Department>(
      'SELECT * FROM departments WHERE code = $1 AND organization_id = $2;',
      [code, organizationId],
      client,
    );
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Department>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];

    if (params?.status) {
      conditions.push('status = $2');
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM departments ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['name', 'code', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Department>(
      `SELECT * FROM departments ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateDepartmentInput,
    client?: PoolClient,
  ): Promise<Department | null> {
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
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE departments SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Department>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM departments WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const departmentRepository = new DepartmentRepository();
