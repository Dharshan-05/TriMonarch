import { PoolClient } from 'pg';
import { query, queryOne } from '../../db/query';
import { BaseRepositoryContract, BaseFilterParams } from './repository.types';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './pagination';
import { sanitizeSortColumn, sanitizeSortOrder } from './repository.utils';

export abstract class BaseRepository<
  T extends { id: string; organization_id?: string },
  CreateInput = unknown,
  UpdateInput = unknown,
  Filter extends BaseFilterParams = BaseFilterParams,
> implements BaseRepositoryContract<T, CreateInput, UpdateInput, Filter>
{
  protected abstract readonly tableName: string;
  protected abstract readonly allowedSortFields: string[];
  protected readonly defaultSortBy: string = 'created_at';
  protected readonly isOrganizationScoped: boolean = true;

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<T | null> {
    if (this.isOrganizationScoped) {
      return queryOne<T>(
        `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2;`,
        [id, organizationId],
        client,
      );
    }
    return queryOne<T>(`SELECT * FROM ${this.tableName} WHERE id = $1;`, [id], client);
  }

  async exists(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    let sql: string;
    let values: unknown[];

    if (this.isOrganizationScoped) {
      sql = `SELECT 1 FROM ${this.tableName} WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      values = [id, organizationId];
    } else {
      sql = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1;`;
      values = [id];
    }

    const rows = await query<{ '?column?': number }>(sql, values, client);
    return rows.length > 0;
  }

  async count(organizationId: string, filter?: Filter, client?: PoolClient): Promise<number> {
    const { conditions, values } = this.buildFilterConditions(organizationId, filter);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause};`,
      values,
      client,
    );
    return parseInt(rows[0]?.count || '0', 10);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    let sql: string;
    let values: unknown[];

    if (this.isOrganizationScoped) {
      sql = `DELETE FROM ${this.tableName} WHERE id = $1 AND organization_id = $2 RETURNING id;`;
      values = [id, organizationId];
    } else {
      sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id;`;
      values = [id];
    }

    const rows = await query<{ id: string }>(sql, values, client);
    return rows.length > 0;
  }

  async listByOrganization(
    organizationId: string,
    params?: Filter & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<T>> {
    const { conditions, values } = this.buildFilterConditions(organizationId, params);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const safeSortBy = sanitizeSortColumn(params?.sortBy, this.allowedSortFields, this.defaultSortBy);
    const safeSortOrder = sanitizeSortOrder(params?.sortOrder);

    const pagination = buildPaginationClause({
      params: { ...params, sortBy: safeSortBy, sortOrder: safeSortOrder.toLowerCase() as 'asc' | 'desc' },
      allowedSortFields: this.allowedSortFields,
      defaultSortBy: this.defaultSortBy,
    });

    const items = await query<T>(
      `SELECT * FROM ${this.tableName} ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  abstract create(data: CreateInput, client?: PoolClient): Promise<T>;
  abstract update(
    organizationId: string,
    id: string,
    data: UpdateInput,
    client?: PoolClient,
  ): Promise<T | null>;

  protected buildFilterConditions(
    organizationId: string,
    params?: Filter,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (this.isOrganizationScoped) {
      conditions.push(`organization_id = $${idx++}`);
      values.push(organizationId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }
}
