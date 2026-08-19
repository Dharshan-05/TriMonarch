import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { User, CreateUserInput, UpdateUserInput } from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export type UserWithAuth = User & {
  password_hash: string | null;
  password_changed_at: Date | null;
  last_login_at: Date | null;
};

export interface UserFilterParams extends BaseFilterParams {
  query?: string;
  status?: string;
}

export class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilterParams
> {
  protected readonly tableName = 'users';
  protected readonly allowedSortFields = ['name', 'email', 'status', 'created_at', 'updated_at'];
  protected readonly defaultSortBy = 'name';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateUserInput, client?: PoolClient): Promise<User> {
    const rows = await query<User>(
      `INSERT INTO users (organization_id, name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, email, phone, status, created_at, updated_at;`,
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

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<User | null> {
    return queryOne<User>(
      'SELECT id, organization_id, name, email, phone, status, created_at, updated_at FROM users WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByEmail(organizationId: string, email: string, client?: PoolClient): Promise<User | null>;
  async findByEmail(email: string, client?: PoolClient): Promise<User | null>;
  async findByEmail(
    orgIdOrEmail: string,
    emailOrClient?: string | PoolClient,
    client?: PoolClient,
  ): Promise<User | null> {
    if (typeof emailOrClient === 'string') {
      return queryOne<User>(
        'SELECT id, organization_id, name, email, phone, status, created_at, updated_at FROM users WHERE organization_id = $1 AND email = $2;',
        [orgIdOrEmail, emailOrClient],
        client,
      );
    }
    const actualClient = emailOrClient as PoolClient | undefined;
    return queryOne<User>(
      'SELECT id, organization_id, name, email, phone, status, created_at, updated_at FROM users WHERE email = $1;',
      [orgIdOrEmail],
      actualClient,
    );
  }

  async findByEmailForAuthentication(
    email: string,
    client?: PoolClient,
  ): Promise<UserWithAuth | null> {
    return queryOne<UserWithAuth>(
      'SELECT id, organization_id, name, email, phone, status, created_at, updated_at, password_hash, password_changed_at, last_login_at FROM users WHERE email = $1;',
      [email],
      client,
    );
  }

  async updateLastLogin(id: string, client?: PoolClient): Promise<void> {
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;',
      [id],
      client,
    );
  }

  async updatePasswordHash(
    id: string,
    passwordHash: string,
    client?: PoolClient,
  ): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2;',
      [passwordHash, id],
      client,
    );
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
    const sql = `UPDATE users SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING id, organization_id, name, email, phone, status, created_at, updated_at;`;
    return queryOne<User>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: UserFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }

  async listByOrganization(
    organizationId: string,
    params?: UserFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<User>> {
    return super.listByOrganization(organizationId, params, client);
  }
}

export const userRepository = new UserRepository();
