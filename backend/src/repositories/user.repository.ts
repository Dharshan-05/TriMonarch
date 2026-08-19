import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { User, CreateUserInput, UpdateUserInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class UserRepository {
  async create(data: CreateUserInput, client?: PoolClient): Promise<User> {
    const rows = await query<User>(
      `INSERT INTO users (organization_id, name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.organization_id,
        data.name,
        data.email,
        data.phone || null,
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<User | null> {
    return queryOne<User>(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByEmail(email: string, client?: PoolClient): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE email = $1;', [email], client);
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<User>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];

    if (params?.status) {
      conditions.push('status = $2');
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['name', 'email', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<User>(
      `SELECT * FROM users ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateUserInput,
    client?: PoolClient,
  ): Promise<User | null> {
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
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<User>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const userRepository = new UserRepository();
