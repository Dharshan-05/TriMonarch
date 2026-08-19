import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  StockReservation,
  CreateStockReservationInput,
  UpdateStockReservationInput,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';

export interface StockReservationFilterParams extends BaseFilterParams {
  productId?: string;
  warehouseId?: string;
  status?: string;
  referenceType?: string;
  referenceId?: string;
  isExpired?: boolean;
}

export class StockReservationRepository extends BaseRepository<
  StockReservation,
  CreateStockReservationInput,
  UpdateStockReservationInput,
  StockReservationFilterParams
> {
  protected readonly tableName = 'stock_reservations';
  protected readonly allowedSortFields = [
    'created_at',
    'updated_at',
    'quantity',
    'status',
    'expires_at',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateStockReservationInput, client?: PoolClient): Promise<StockReservation> {
    const rows = await query<StockReservation>(
      `INSERT INTO stock_reservations (organization_id, product_id, warehouse_id, quantity, status, reference_type, reference_id, expires_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [
        data.organization_id,
        data.product_id,
        data.warehouse_id,
        String(data.quantity),
        data.status || 'active',
        data.reference_type || null,
        data.reference_id || null,
        data.expires_at ? new Date(data.expires_at) : null,
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<StockReservation | null> {
    return queryOne<StockReservation>(
      'SELECT * FROM stock_reservations WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<StockReservation | null> {
    return queryOne<StockReservation>(
      'SELECT * FROM stock_reservations WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateStockReservationInput,
    client?: PoolClient,
  ): Promise<StockReservation | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(String(data.quantity));
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.expires_at !== undefined) {
      fields.push(`expires_at = $${idx++}`);
      values.push(data.expires_at ? new Date(data.expires_at) : null);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE stock_reservations SET ${fields.join(
      ', ',
    )} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<StockReservation>(sql, values, client);
  }

  async listByProduct(
    organizationId: string,
    productId: string,
    params?: StockReservationFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<StockReservation>> {
    return this.listByOrganization(organizationId, { ...params, productId }, client);
  }

  async listByWarehouse(
    organizationId: string,
    warehouseId: string,
    params?: StockReservationFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<StockReservation>> {
    return this.listByOrganization(organizationId, { ...params, warehouseId }, client);
  }

  async listActiveByProductAndWarehouse(
    organizationId: string,
    productId: string,
    warehouseId: string,
    client?: PoolClient,
  ): Promise<StockReservation[]> {
    return query<StockReservation>(
      `SELECT * FROM stock_reservations
       WHERE organization_id = $1
         AND product_id = $2
         AND warehouse_id = $3
         AND status = 'active'
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY created_at ASC;`,
      [organizationId, productId, warehouseId],
      client,
    );
  }

  async listByReference(
    organizationId: string,
    referenceType: string,
    referenceId: string,
    client?: PoolClient,
  ): Promise<StockReservation[]> {
    return query<StockReservation>(
      `SELECT * FROM stock_reservations
       WHERE organization_id = $1 AND reference_type = $2 AND reference_id = $3
       ORDER BY created_at ASC;`,
      [organizationId, referenceType, referenceId],
      client,
    );
  }

  async getSumActiveQuantity(
    organizationId: string,
    productId: string,
    warehouseId: string,
    client?: PoolClient,
  ): Promise<string> {
    const rows = await query<{ total_reserved: string }>(
      `SELECT COALESCE(SUM(quantity), 0)::text AS total_reserved
       FROM stock_reservations
       WHERE organization_id = $1
         AND product_id = $2
         AND warehouse_id = $3
         AND status = 'active'
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);`,
      [organizationId, productId, warehouseId],
      client,
    );
    return rows[0]?.total_reserved || '0.0000';
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: StockReservationFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.productId) {
      conditions.push(`product_id = $${idx++}`);
      values.push(params.productId);
    }
    if (params?.warehouseId) {
      conditions.push(`warehouse_id = $${idx++}`);
      values.push(params.warehouseId);
    }
    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params?.referenceType) {
      conditions.push(`reference_type = $${idx++}`);
      values.push(params.referenceType);
    }
    if (params?.referenceId) {
      conditions.push(`reference_id = $${idx++}`);
      values.push(params.referenceId);
    }
    if (params?.isExpired !== undefined) {
      if (params.isExpired) {
        conditions.push(`expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`);
      } else {
        conditions.push(`(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`);
      }
    }

    return { conditions, values };
  }
}

export const stockReservationRepository = new StockReservationRepository();
