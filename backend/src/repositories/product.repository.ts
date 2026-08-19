import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Product, CreateProductInput, UpdateProductInput } from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface ProductFilterParams extends BaseFilterParams {
  query?: string;
  category?: string;
  status?: string;
}

export class ProductRepository extends BaseRepository<
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams
> {
  protected readonly tableName = 'products';
  protected readonly allowedSortFields = [
    'name',
    'sku',
    'category',
    'price',
    'cost',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'name';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateProductInput, client?: PoolClient): Promise<Product> {
    const rows = await query<Product>(
      `INSERT INTO products (organization_id, sku, name, description, category, unit, price, cost, tax_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        data.organization_id,
        data.sku,
        data.name,
        data.description || null,
        data.category || null,
        data.unit || 'pcs',
        data.price !== undefined ? String(data.price) : '0.0000',
        data.cost !== undefined ? String(data.cost) : '0.0000',
        data.tax_rate !== undefined ? String(data.tax_rate) : '0.000000',
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

  async update(
    organizationId: string,
    id: string,
    data: UpdateProductInput,
    client?: PoolClient,
  ): Promise<Product | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.sku !== undefined) {
      fields.push(`sku = $${idx++}`);
      values.push(data.sku);
    }
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
    if (data.price !== undefined) {
      fields.push(`price = $${idx++}`);
      values.push(String(data.price));
    }
    if (data.cost !== undefined) {
      fields.push(`cost = $${idx++}`);
      values.push(String(data.cost));
    }
    if (data.tax_rate !== undefined) {
      fields.push(`tax_rate = $${idx++}`);
      values.push(String(data.tax_rate));
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE products SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Product>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: ProductFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(name ILIKE $${idx} OR sku ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.category) {
      conditions.push(`category = $${idx++}`);
      values.push(params.category);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }

  async search(
    organizationId: string,
    searchParams: ProductFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Product>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }
}

export const productRepository = new ProductRepository();
