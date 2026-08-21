import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  ManufacturingConsumptionReversal,
  CreateManufacturingConsumptionReversalInput,
  ManufacturingProductionReversal,
  CreateManufacturingProductionReversalInput,
} from '../types/database';
import { PaginationParams, PaginatedResult, createPaginatedResult } from './base/pagination';

export class ManufacturingRollbackRepository {
  async createConsumptionReversal(
    data: CreateManufacturingConsumptionReversalInput,
    client?: PoolClient,
  ): Promise<ManufacturingConsumptionReversal> {
    const rows = await query<ManufacturingConsumptionReversal>(
      `INSERT INTO manufacturing_consumption_reversals (
         organization_id, manufacturing_order_id, manufacturing_material_consumption_id,
         manufacturing_order_item_id, product_id, warehouse_id, reversal_number,
         quantity, reversed_by, reversed_at, reason
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, CURRENT_TIMESTAMP), $11)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.manufacturing_material_consumption_id || null,
        data.manufacturing_order_item_id,
        data.product_id,
        data.warehouse_id,
        data.reversal_number,
        String(data.quantity),
        data.reversed_by || null,
        data.reversed_at || null,
        data.reason || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async createProductionReversal(
    data: CreateManufacturingProductionReversalInput,
    client?: PoolClient,
  ): Promise<ManufacturingProductionReversal> {
    const rows = await query<ManufacturingProductionReversal>(
      `INSERT INTO manufacturing_production_reversals (
         organization_id, manufacturing_order_id, manufacturing_production_id,
         product_id, warehouse_id, reversal_number, quantity, reversed_by,
         reversed_at, reason
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP), $10)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.manufacturing_production_id || null,
        data.product_id,
        data.warehouse_id,
        data.reversal_number,
        String(data.quantity),
        data.reversed_by || null,
        data.reversed_at || null,
        data.reason || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findConsumptionReversalByNumber(
    organizationId: string,
    reversalNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingConsumptionReversal | null> {
    return queryOne<ManufacturingConsumptionReversal>(
      'SELECT * FROM manufacturing_consumption_reversals WHERE reversal_number = $1 AND organization_id = $2;',
      [reversalNumber, organizationId],
      client,
    );
  }

  async findProductionReversalByNumber(
    organizationId: string,
    reversalNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingProductionReversal | null> {
    return queryOne<ManufacturingProductionReversal>(
      'SELECT * FROM manufacturing_production_reversals WHERE reversal_number = $1 AND organization_id = $2;',
      [reversalNumber, organizationId],
      client,
    );
  }

  async listConsumptionReversals(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingConsumptionReversal>> {
    const page = params?.page || 1;
    const limit = params?.pageSize || 20;
    const offset = (page - 1) * limit;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM manufacturing_consumption_reversals
       WHERE manufacturing_order_id = $1 AND organization_id = $2;`,
      [manufacturingOrderId, organizationId],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const items = await query<ManufacturingConsumptionReversal>(
      `SELECT * FROM manufacturing_consumption_reversals
       WHERE manufacturing_order_id = $1 AND organization_id = $2
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4;`,
      [manufacturingOrderId, organizationId, limit, offset],
      client,
    );

    return createPaginatedResult(items, total, page, limit);
  }

  async listProductionReversals(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingProductionReversal>> {
    const page = params?.page || 1;
    const limit = params?.pageSize || 20;
    const offset = (page - 1) * limit;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM manufacturing_production_reversals
       WHERE manufacturing_order_id = $1 AND organization_id = $2;`,
      [manufacturingOrderId, organizationId],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const items = await query<ManufacturingProductionReversal>(
      `SELECT * FROM manufacturing_production_reversals
       WHERE manufacturing_order_id = $1 AND organization_id = $2
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4;`,
      [manufacturingOrderId, organizationId, limit, offset],
      client,
    );

    return createPaginatedResult(items, total, page, limit);
  }
}

export const manufacturingRollbackRepository = new ManufacturingRollbackRepository();
