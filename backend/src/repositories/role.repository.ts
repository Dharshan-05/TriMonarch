import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Role, CreateRoleInput, UpdateRoleInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class RoleRepository {
  async create(data: CreateRoleInput, client?: PoolClient): Promise<Role> {
    const rows = await query<Role>(
      `INSERT INTO roles (organization_id, name, code, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [data.organization_id, data.name, data.code, data.description || null],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Role | null> {
    return queryOne<Role>(
      'SELECT * FROM roles WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByCode(organizationId: string, code: string, client?: PoolClient): Promise<Role | null> {
    return queryOne<Role>(
      'SELECT * FROM roles WHERE code = $1 AND organization_id = $2;',
      [code, organizationId],
      client,
    );
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Role>> {
    const countRes = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM roles WHERE organization_id = $1;',
      [organizationId],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['name', 'code', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Role>(
      `SELECT * FROM roles WHERE organization_id = $1 ${pagination.sql};`,
      [organizationId],
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateRoleInput,
    client?: PoolClient,
  ): Promise<Role | null> {
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

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE roles SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Role>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM roles WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }

  async assignRoleToUser(userId: string, roleId: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ user_id: string }>(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING
       RETURNING user_id;`,
      [userId, roleId],
      client,
    );
    return rows.length > 0;
  }

  async removeRoleFromUser(userId: string, roleId: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ user_id: string }>(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING user_id;',
      [userId, roleId],
      client,
    );
    return rows.length > 0;
  }

  async listUserRoles(userId: string, client?: PoolClient): Promise<Role[]> {
    return query<Role>(
      `SELECT r.* FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1;`,
      [userId],
      client,
    );
  }
}

export const roleRepository = new RoleRepository();
