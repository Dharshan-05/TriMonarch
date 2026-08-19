import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  Bom,
  BomItem,
  CreateBomInput,
  UpdateBomInput,
  CreateBomItemInput,
  UpdateBomItemInput,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { formatLikeSearch } from './base/repository.utils';

export interface BomFilterParams extends BaseFilterParams {
  query?: string;
  productId?: string;
  status?: string;
}

export class BomRepository extends BaseRepository<
  Bom,
  CreateBomInput,
  UpdateBomInput,
  BomFilterParams
> {
  protected readonly tableName = 'boms';
  protected readonly allowedSortFields = [
    'name',
    'bom_code',
    'version',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'bom_code';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateBomInput, client?: PoolClient): Promise<Bom> {
    const rows = await query<Bom>(
      `INSERT INTO boms (organization_id, product_id, bom_code, name, version, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        data.organization_id,
        data.product_id,
        data.bom_code,
        data.name,
        data.version !== undefined ? data.version : 1,
        data.status || 'active',
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByCode(
    organizationId: string,
    bomCode: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE bom_code = $1 AND organization_id = $2;',
      [bomCode, organizationId],
      client,
    );
  }

  async findByProductId(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<Bom[]> {
    return query<Bom>(
      'SELECT * FROM boms WHERE product_id = $1 AND organization_id = $2 ORDER BY version DESC;',
      [productId, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateBomInput,
    client?: PoolClient,
  ): Promise<Bom | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.product_id !== undefined) {
      fields.push(`product_id = $${idx++}`);
      values.push(data.product_id);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.version !== undefined) {
      fields.push(`version = $${idx++}`);
      values.push(data.version);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE boms SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Bom>(sql, values, client);
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: BomFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(name ILIKE $${idx} OR bom_code ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    if (params?.productId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(params.productId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    return { conditions, values };
  }

  async search(
    organizationId: string,
    searchParams: BomFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Bom>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }

  // BOM Item Operations
  async createItem(data: CreateBomItemInput, client?: PoolClient): Promise<BomItem> {
    const rows = await query<BomItem>(
      `INSERT INTO bom_items (organization_id, bom_id, component_product_id, quantity, unit, sequence)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        data.organization_id,
        data.bom_id,
        data.component_product_id,
        data.quantity !== undefined ? String(data.quantity) : '1.0000',
        data.unit || 'pcs',
        data.sequence !== undefined ? data.sequence : 1,
      ],
      client,
    );
    return rows[0]!;
  }

  async findItemById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<BomItem | null> {
    return queryOne<BomItem>(
      'SELECT * FROM bom_items WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    bomId: string,
    client?: PoolClient,
  ): Promise<BomItem[]> {
    return query<BomItem>(
      'SELECT * FROM bom_items WHERE bom_id = $1 AND organization_id = $2 ORDER BY sequence ASC;',
      [bomId, organizationId],
      client,
    );
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdateBomItemInput,
    client?: PoolClient,
  ): Promise<BomItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.component_product_id !== undefined) {
      fields.push(`component_product_id = $${idx++}`);
      values.push(data.component_product_id);
    }
    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(String(data.quantity));
    }
    if (data.unit !== undefined) {
      fields.push(`unit = $${idx++}`);
      values.push(data.unit);
    }
    if (data.sequence !== undefined) {
      fields.push(`sequence = $${idx++}`);
      values.push(data.sequence);
    }

    if (fields.length === 0) {
      return this.findItemById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE bom_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<BomItem>(sql, values, client);
  }

  async deleteItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM bom_items WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const bomRepository = new BomRepository();
