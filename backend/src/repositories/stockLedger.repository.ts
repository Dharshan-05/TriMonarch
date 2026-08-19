import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  StockLedgerEntry,
  CreateStockLedgerInput,
  StockMovementType,
  StockMovementSummary,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';
import { PaginationParams } from './base/pagination';

export interface StockLedgerFilterParams extends BaseFilterParams {
  productId?: string;
  warehouseId?: string;
  movementType?: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

export class StockLedgerRepository extends BaseRepository<
  StockLedgerEntry,
  CreateStockLedgerInput,
  never,
  StockLedgerFilterParams
> {
  protected readonly tableName = 'stock_ledger';
  protected readonly allowedSortFields = [
    'created_at',
    'quantity',
    'movement_type',
    'reference_type',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  // Immutability: Override update and delete to enforce immutable ledger entries
  async update(): Promise<never> {
    throw new Error('Stock ledger entries are immutable and cannot be updated');
  }

  override async delete(): Promise<never> {
    throw new Error('Stock ledger entries are immutable and cannot be deleted');
  }

  // Create immutable movement entry
  async create(data: CreateStockLedgerInput, client?: PoolClient): Promise<StockLedgerEntry> {
    const rawQtyStr = String(data.quantity);
    let normalizedQtyStr = rawQtyStr;

    // Standardize movement sign convention:
    // OUT and TRANSFER_OUT represent inventory reduction (negative)
    // IN and TRANSFER_IN represent inventory addition (positive)
    // ADJUSTMENT preserves signed decimal input (+ or -)
    if (data.movement_type === 'OUT' || data.movement_type === 'TRANSFER_OUT') {
      if (!rawQtyStr.startsWith('-')) {
        normalizedQtyStr = `-${rawQtyStr}`;
      }
    } else if (data.movement_type === 'IN' || data.movement_type === 'TRANSFER_IN') {
      if (rawQtyStr.startsWith('-')) {
        normalizedQtyStr = rawQtyStr.substring(1);
      }
    }

    const rows = await query<StockLedgerEntry>(
      `INSERT INTO stock_ledger (
         organization_id, product_id, warehouse_id, movement_type,
         quantity, unit, reference_type, reference_id, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [
        data.organization_id,
        data.product_id,
        data.warehouse_id,
        data.movement_type,
        normalizedQtyStr,
        data.unit || 'pcs',
        data.reference_type || null,
        data.reference_id || null,
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<StockLedgerEntry | null> {
    return queryOne<StockLedgerEntry>(
      'SELECT * FROM stock_ledger WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: StockLedgerFilterParams,
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

    if (params?.movementType) {
      conditions.push(`movement_type = $${idx++}`);
      values.push(params.movementType);
    }

    if (params?.referenceType) {
      conditions.push(`reference_type = $${idx++}`);
      values.push(params.referenceType);
    }

    if (params?.referenceId) {
      conditions.push(`reference_id = $${idx++}`);
      values.push(params.referenceId);
    }

    if (params?.dateFrom) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(params.dateFrom);
    }

    if (params?.dateTo) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(params.dateTo);
    }

    return { conditions, values };
  }

  async listByProduct(
    organizationId: string,
    productId: string,
    params?: StockLedgerFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<StockLedgerEntry>> {
    return this.listByOrganization(organizationId, { ...params, productId }, client);
  }

  async listByWarehouse(
    organizationId: string,
    warehouseId: string,
    params?: StockLedgerFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<StockLedgerEntry>> {
    return this.listByOrganization(organizationId, { ...params, warehouseId }, client);
  }

  async listByProductAndWarehouse(
    organizationId: string,
    productId: string,
    warehouseId: string,
    params?: StockLedgerFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<StockLedgerEntry>> {
    return this.listByOrganization(organizationId, { ...params, productId, warehouseId }, client);
  }

  async listByReference(
    organizationId: string,
    referenceType: string,
    referenceId: string,
    client?: PoolClient,
  ): Promise<StockLedgerEntry[]> {
    return query<StockLedgerEntry>(
      'SELECT * FROM stock_ledger WHERE reference_type = $1 AND reference_id = $2 AND organization_id = $3 ORDER BY created_at ASC;',
      [referenceType, referenceId, organizationId],
      client,
    );
  }

  async getCurrentStock(
    organizationId: string,
    productId: string,
    warehouseId?: string,
    client?: PoolClient,
  ): Promise<string> {
    const conditions: string[] = ['organization_id = $1', 'product_id = $2'];
    const values: unknown[] = [organizationId, productId];

    if (warehouseId) {
      conditions.push('warehouse_id = $3');
      values.push(warehouseId);
    }

    const rows = await query<{ current_stock: string }>(
      `SELECT COALESCE(SUM(quantity), 0)::text AS current_stock FROM stock_ledger WHERE ${conditions.join(
        ' AND ',
      )};`,
      values,
      client,
    );

    return rows[0]?.current_stock || '0.0000';
  }

  async getStockMovementSummary(
    organizationId: string,
    productId: string,
    warehouseId?: string,
    client?: PoolClient,
  ): Promise<StockMovementSummary> {
    const conditions: string[] = ['organization_id = $1', 'product_id = $2'];
    const values: unknown[] = [organizationId, productId];

    if (warehouseId) {
      conditions.push('warehouse_id = $3');
      values.push(warehouseId);
    }

    const whereClause = conditions.join(' AND ');

    const rows = await query<{
      total_in: string;
      total_out: string;
      total_adjustment: string;
      current_stock: string;
      movement_count: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN movement_type IN ('IN', 'TRANSFER_IN') THEN quantity ELSE 0 END), 0)::text AS total_in,
         COALESCE(SUM(CASE WHEN movement_type IN ('OUT', 'TRANSFER_OUT') THEN ABS(quantity) ELSE 0 END), 0)::text AS total_out,
         COALESCE(SUM(CASE WHEN movement_type = 'ADJUSTMENT' THEN quantity ELSE 0 END), 0)::text AS total_adjustment,
         COALESCE(SUM(quantity), 0)::text AS current_stock,
         COUNT(*)::text AS movement_count
       FROM stock_ledger
       WHERE ${whereClause};`,
      values,
      client,
    );

    const res = rows[0]!;
    return {
      total_in: res.total_in,
      total_out: res.total_out,
      total_adjustment: res.total_adjustment,
      current_stock: res.current_stock,
      movement_count: parseInt(res.movement_count || '0', 10),
    };
  }
}

export const stockLedgerRepository = new StockLedgerRepository();
