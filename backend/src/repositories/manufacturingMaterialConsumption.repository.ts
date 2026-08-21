import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  ManufacturingMaterialConsumption,
  CreateManufacturingMaterialConsumptionInput,
} from '../types/database';

export class ManufacturingMaterialConsumptionRepository {
  async create(
    data: CreateManufacturingMaterialConsumptionInput,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption> {
    const rows = await query<ManufacturingMaterialConsumption>(
      `INSERT INTO manufacturing_material_consumptions (
         organization_id, manufacturing_order_id, manufacturing_order_item_id,
         product_id, warehouse_id, quantity, consumed_at, consumed_by,
         reference_number, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP), $8, $9, $10)
       RETURNING *;`,
      [
        data.organization_id,
        data.manufacturing_order_id,
        data.manufacturing_order_item_id,
        data.product_id,
        data.warehouse_id,
        String(data.quantity),
        data.consumed_at || null,
        data.consumed_by || null,
        data.reference_number || null,
        data.notes || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async createBatch(
    items: CreateManufacturingMaterialConsumptionInput[],
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption[]> {
    const results: ManufacturingMaterialConsumption[] = [];
    for (const item of items) {
      const created = await this.create(item, client);
      results.push(created);
    }
    return results;
  }

  async findById(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption | null> {
    return queryOne<ManufacturingMaterialConsumption>(
      'SELECT * FROM manufacturing_material_consumptions WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByManufacturingOrderId(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption[]> {
    return query<ManufacturingMaterialConsumption>(
      `SELECT * FROM manufacturing_material_consumptions
       WHERE manufacturing_order_id = $1 AND organization_id = $2
       ORDER BY created_at ASC;`,
      [manufacturingOrderId, organizationId],
      client,
    );
  }

  async findByReferenceNumber(
    organizationId: string,
    referenceNumber: string,
    client?: PoolClient,
  ): Promise<ManufacturingMaterialConsumption | null> {
    return queryOne<ManufacturingMaterialConsumption>(
      'SELECT * FROM manufacturing_material_consumptions WHERE reference_number = $1 AND organization_id = $2;',
      [referenceNumber, organizationId],
      client,
    );
  }

  async getConsumedQuantityForItem(
    organizationId: string,
    manufacturingOrderItemId: string,
    client?: PoolClient,
  ): Promise<string> {
    const rows = await query<{ total_consumed: string }>(
      `SELECT COALESCE(SUM(quantity), 0)::text AS total_consumed
       FROM manufacturing_material_consumptions
       WHERE manufacturing_order_item_id = $1 AND organization_id = $2;`,
      [manufacturingOrderItemId, organizationId],
      client,
    );
    return rows[0]?.total_consumed || '0.0000';
  }
}

export const manufacturingMaterialConsumptionRepository =
  new ManufacturingMaterialConsumptionRepository();
