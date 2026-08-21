import { pool } from '../../../src/config/database';
import { logger } from '../../../src/utils/logger';

export const cleanIntegrationTestData = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Truncate in safe dependency order if database is connected
      await client.query('TRUNCATE TABLE audit_logs, stock_ledger, manufacturing_orders, bom_components, boms, purchase_order_items, purchase_orders, sales_order_items, sales_orders, inventory, products, partners, users RESTART IDENTITY CASCADE;');
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.debug({ err }, 'Clean test data skipped (DB offline or uninitialized)');
  }
};
