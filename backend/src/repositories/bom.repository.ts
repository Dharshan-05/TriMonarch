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
  product_id?: string;
  status?: string;
  is_default?: boolean;
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
    'bom_number',
    'bom_code',
    'revision',
    'version',
    'status',
    'created_at',
    'updated_at',
  ];
  protected readonly defaultSortBy = 'bom_number';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateBomInput, client?: PoolClient): Promise<Bom> {
    const bomNumber = data.bom_number || data.bom_code || `BOM-${Date.now()}`;
    const bomCode = data.bom_code || bomNumber;
    const revision = data.revision || String(data.version || 1);
    const version = data.version !== undefined ? data.version : parseInt(revision, 10) || 1;

    const rows = await query<Bom>(
      `INSERT INTO boms (
         organization_id, product_id, bom_number, bom_code, revision, version, name, status,
         effective_from, effective_to, is_default, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *;`,
      [
        data.organization_id,
        data.product_id,
        bomNumber,
        bomCode,
        revision,
        version,
        data.name || bomNumber,
        data.status || 'draft',
        data.effective_from || null,
        data.effective_to || null,
        data.is_default || false,
        data.notes || null,
        data.created_by || null,
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

  async findByIdWithComponents(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<(Bom & { items: BomItem[] }) | null> {
    const bom = await this.findById(organizationId, id, client);
    if (!bom) return null;

    const items = await this.listComponents(organizationId, id, client);
    return {
      ...bom,
      items,
    };
  }

  async findByBomNumber(
    organizationId: string,
    bomNumber: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE (bom_number = $1 OR bom_code = $1) AND organization_id = $2;',
      [bomNumber, organizationId],
      client,
    );
  }

  async findByCode(
    organizationId: string,
    bomCode: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return this.findByBomNumber(organizationId, bomCode, client);
  }

  async findByProductId(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<Bom[]> {
    return query<Bom>(
      'SELECT * FROM boms WHERE product_id = $1 AND organization_id = $2 ORDER BY created_at DESC;',
      [productId, organizationId],
      client,
    );
  }

  async findByProductAndRevision(
    organizationId: string,
    productId: string,
    revision: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE product_id = $1 AND revision = $2 AND organization_id = $3;',
      [productId, revision, organizationId],
      client,
    );
  }

  async findLatestRevision(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE product_id = $1 AND organization_id = $2 ORDER BY created_at DESC LIMIT 1;',
      [productId, organizationId],
      client,
    );
  }

  async findDefaultBom(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      "SELECT * FROM boms WHERE product_id = $1 AND organization_id = $2 AND is_default = true AND status = 'active';",
      [productId, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    return queryOne<Bom>(
      'SELECT * FROM boms WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
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
    if (data.bom_number !== undefined) {
      fields.push(`bom_number = $${idx++}`);
      values.push(data.bom_number);
    }
    if (data.bom_code !== undefined) {
      fields.push(`bom_code = $${idx++}`);
      values.push(data.bom_code);
    }
    if (data.revision !== undefined) {
      fields.push(`revision = $${idx++}`);
      values.push(data.revision);
    }
    if (data.version !== undefined) {
      fields.push(`version = $${idx++}`);
      values.push(data.version);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.effective_from !== undefined) {
      fields.push(`effective_from = $${idx++}`);
      values.push(data.effective_from);
    }
    if (data.effective_to !== undefined) {
      fields.push(`effective_to = $${idx++}`);
      values.push(data.effective_to);
    }
    if (data.is_default !== undefined) {
      fields.push(`is_default = $${idx++}`);
      values.push(data.is_default);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }
    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${idx++}`);
      values.push(data.updated_by);
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

  async clearDefaultBom(
    organizationId: string,
    productId: string,
    client?: PoolClient,
  ): Promise<void> {
    await query(
      'UPDATE boms SET is_default = false WHERE organization_id = $1 AND product_id = $2 AND is_default = true;',
      [organizationId, productId],
      client,
    );
  }

  async setDefaultBom(
    organizationId: string,
    bomId: string,
    client?: PoolClient,
  ): Promise<Bom | null> {
    const targetBom = await this.findById(organizationId, bomId, client);
    if (!targetBom) return null;

    await this.clearDefaultBom(organizationId, targetBom.product_id, client);

    return queryOne<Bom>(
      'UPDATE boms SET is_default = true WHERE id = $1 AND organization_id = $2 RETURNING *;',
      [bomId, organizationId],
      client,
    );
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: BomFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.query) {
      conditions.push(`(name ILIKE $${idx} OR bom_number ILIKE $${idx} OR bom_code ILIKE $${idx})`);
      values.push(formatLikeSearch(params.query));
      idx++;
    }

    const pId = params?.product_id || params?.productId;
    if (pId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(pId);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.is_default !== undefined) {
      conditions.push(`is_default = $${idx++}`);
      values.push(params.is_default);
    }

    return { conditions, values };
  }

  async listBoms(
    organizationId: string,
    params?: BomFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Bom>> {
    return this.listByOrganization(organizationId, params, client);
  }

  async search(
    organizationId: string,
    searchParams: BomFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Bom>> {
    return this.listByOrganization(organizationId, searchParams, client);
  }

  // BOM Item / Component Operations
  async createComponent(data: CreateBomItemInput, client?: PoolClient): Promise<BomItem> {
    const rows = await query<BomItem>(
      `INSERT INTO bom_items (organization_id, bom_id, component_product_id, quantity, unit, scrap_percentage, sequence, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.bom_id,
        data.component_product_id,
        data.quantity !== undefined ? String(data.quantity) : '1.0000',
        data.unit || 'pcs',
        data.scrap_percentage !== undefined ? String(data.scrap_percentage) : '0.00',
        data.sequence !== undefined ? data.sequence : 1,
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async createItem(data: CreateBomItemInput, client?: PoolClient): Promise<BomItem> {
    return this.createComponent(data, client);
  }

  async findComponentById(
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

  async findItemById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<BomItem | null> {
    return this.findComponentById(organizationId, id, client);
  }

  async findComponentByBomAndProduct(
    organizationId: string,
    bomId: string,
    componentProductId: string,
    client?: PoolClient,
  ): Promise<BomItem | null> {
    return queryOne<BomItem>(
      'SELECT * FROM bom_items WHERE bom_id = $1 AND component_product_id = $2 AND organization_id = $3;',
      [bomId, componentProductId, organizationId],
      client,
    );
  }

  async listComponents(
    organizationId: string,
    bomId: string,
    client?: PoolClient,
  ): Promise<BomItem[]> {
    return query<BomItem>(
      'SELECT * FROM bom_items WHERE bom_id = $1 AND organization_id = $2 ORDER BY sequence ASC, created_at ASC;',
      [bomId, organizationId],
      client,
    );
  }

  async listItems(
    organizationId: string,
    bomId: string,
    client?: PoolClient,
  ): Promise<BomItem[]> {
    return this.listComponents(organizationId, bomId, client);
  }

  async updateComponent(
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
    if (data.scrap_percentage !== undefined) {
      fields.push(`scrap_percentage = $${idx++}`);
      values.push(String(data.scrap_percentage));
    }
    if (data.sequence !== undefined) {
      fields.push(`sequence = $${idx++}`);
      values.push(data.sequence);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findComponentById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE bom_items SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<BomItem>(sql, values, client);
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdateBomItemInput,
    client?: PoolClient,
  ): Promise<BomItem | null> {
    return this.updateComponent(organizationId, id, data, client);
  }

  async deleteComponent(
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

  async deleteItem(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<boolean> {
    return this.deleteComponent(organizationId, id, client);
  }
}

export const bomRepository = new BomRepository();
