import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  ManufacturingProduction,
  CreateManufacturingProductionInput,
} from '../types/database';
import { PaginationParams, PaginatedResult, createPaginatedResult } from './base/pagination';

export interface ManufacturingProductionFilterParams extends PaginationParams {
  manufacturing_order_id?: string;
  product_id?: string;
  warehouse_id?: string;
}

export class ManufacturingProductionRepository {
  async create(
    data: CreateManufacturingProductionInput,
    client?: PoolClient,
  ): Promise<ManufacturingProduction> {
    const rows = await query<ManufacturingProduction>(
      `INSERT INTO manufacturing_productions (
         organization_id, manufacturing_order_id, product_id, warehouse_id,
         production_number, quantity, produced_by, produced_at, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP), $9)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.product_id,
        data.warehouse_id,
        data.production_number,
        String(data.quantity),
        data.produced_by || null,
        data.produced_at || null,
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<ManufacturingProduction | null> {
    return queryOne<ManufacturingProduction>(
      'SELECT * FROM manufacturing_productions WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByProductionNumber(
    organizationId: string,
    productionNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingProduction | null> {
    return queryOne<ManufacturingProduction>(
      'SELECT * FROM manufacturing_productions WHERE production_number = $1 AND organization_id = $2;',
      [productionNumber, organizationId],
      client,
    );
  }

  async existsByProductionNumber(
    organizationId: string,
    productionNumber: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const record = await this.findByProductionNumber(organizationId, productionNumber, client);
    return !!record;
  }

  async listByManufacturingOrder(
    organizationId: string,
    manufacturingOrderId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<ManufacturingProduction>> {
    const page = params?.page || 1;
    const limit = params?.pageSize || 20;
    const offset = (page - 1) * limit;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM manufacturing_productions
       WHERE manufacturing_order_id = $1 AND organization_id = $2;`,
      [manufacturingOrderId, organizationId],
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const items = await query<ManufacturingProduction>(
      `SELECT * FROM manufacturing_productions
       WHERE manufacturing_order_id = $1 AND organization_id = $2
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4;`,
      [manufacturingOrderId, organizationId, limit, offset],
      client,
    );

    return createPaginatedResult(items, total, page, limit);
  }

  async getSumProducedQuantityForMO(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<string> {
    const rows = await query<{ total_produced: string }>(
      `SELECT COALESCE(SUM(quantity), 0)::text AS total_produced
       FROM manufacturing_productions
       WHERE manufacturing_order_id = $1 AND organization_id = $2;`,
      [manufacturingOrderId, organizationId],
      client,
    );
    return rows[0]?.total_produced || '0.0000';
  }
}

export const manufacturingProductionRepository = new ManufacturingProductionRepository();
