import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Product, CreateProductInput, UpdateProductInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class ProductRepository {
  async create(data: CreateProductInput, client?: PoolClient): Promise<Product> {
    const rows = await query<Product>(
      `INSERT INTO products (organization_id, sku, name, description, category, unit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [
        data.organization_id,
        data.sku,
        data.name,
        data.description || null,
        data.category || null,
        data.unit || 'pcs',
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Product | null> {
    return queryOne<Product>(
      'SELECT * FROM products WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findBySku(organizationId: string, sku: string, client?: PoolClient): Promise<Product | null> {
    return queryOne<Product>(
      'SELECT * FROM products WHERE sku = $1 AND organization_id = $2;',
      [sku, organizationId],
      client,
    );
  }

  async search(
    organizationId: string,
    searchParams: { query?: string; category?: string; status?: string } & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Product>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (searchParams.query) {
      conditions.push(`(name ILIKE $${idx} OR sku ILIKE $${idx})`);
      values.push(`%${searchParams.query}%`);
      idx++;
    }

    if (searchParams.category) {
      conditions.push(`category = $${idx++}`);
      values.push(searchParams.category);
    }

    if (searchParams.status) {
      conditions.push(`status = $${idx++}`);
      values.push(searchParams.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params: searchParams,
      allowedSortFields: ['name', 'sku', 'category', 'status', 'created_at'],
      defaultSortBy: 'name',
    });

    const items = await query<Product>(
      `SELECT * FROM products ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { category?: string; status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Product>> {
    return this.search(organizationId, { ...params }, client);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateProductInput,
    client?: PoolClient,
  ): Promise<Product | null> {
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
    if (data.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(data.category);
    }
    if (data.unit !== undefined) {
      fields.push(`unit = $${idx++}`);
      values.push(data.unit);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Product>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM products WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const productRepository = new ProductRepository();
