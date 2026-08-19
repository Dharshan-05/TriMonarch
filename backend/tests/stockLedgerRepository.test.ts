import { describe, it, expect, vi } from 'vitest';
import { stockLedgerRepository } from '../src/repositories/stockLedger.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, ForeignKeyViolationError, CheckConstraintViolationError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Stock Ledger Repository Subsystem (Phase 017)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const entryId = 'sl-1111';
  const productId = 'prod-1111';
  const warehouseId = 'wh-1111';

  const mockLedgerEntry = {
    id: entryId,
    organization_id: orgAId,
    product_id: productId,
    warehouse_id: warehouseId,
    movement_type: 'IN' as const,
    quantity: '100.0000',
    unit: 'pcs',
    reference_type: 'purchase_order',
    reference_id: 'po-1111',
    notes: 'Initial stock intake',
    created_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO stock_ledger')) {
      const movementType = params?.[3] as string;
      const prodId = params?.[1] as string;
      const qty = params?.[4] as string;

      if (movementType === 'INVALID_TYPE') {
        throw handleDatabaseError({
          code: '23514',
          detail: 'Failing row contains invalid movement_type',
          constraint: 'stock_ledger_movement_type_check',
        });
      }
      if (prodId === 'INVALID-PROD') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (product_id)=(INVALID-PROD) is not present in table "products".',
          constraint: 'stock_ledger_product_id_fkey',
        });
      }
      return {
        rows: [
          {
            ...mockLedgerEntry,
            movement_type: movementType,
            quantity: qty,
          },
        ],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      };
    }
    if (sql.includes('SELECT') && sql.includes('FROM stock_ledger WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === entryId && orgId === orgAId) {
        return { rows: [mockLedgerEntry], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM stock_ledger WHERE reference_type = $1 AND reference_id = $2')) {
      const [refType, refId, orgId] = params as [string, string, string];
      if (refType === 'purchase_order' && refId === 'po-1111' && orgId === orgAId) {
        return { rows: [mockLedgerEntry], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT COALESCE(SUM(quantity), 0)::text AS current_stock FROM stock_ledger')) {
      const orgId = params?.[0] as string;
      if (orgId === orgAId) {
        return { rows: [{ current_stock: '124.5000' }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [{ current_stock: '0.0000' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('total_in') && sql.includes('FROM stock_ledger')) {
      const orgId = params?.[0] as string;
      if (orgId === orgAId) {
        return {
          rows: [
            {
              total_in: '150.0000',
              total_out: '25.5000',
              total_adjustment: '0.0000',
              current_stock: '124.5000',
              movement_count: '3',
            },
          ],
          rowCount: 1,
          command: '',
          oid: 0,
          fields: [],
        };
      }
      return {
        rows: [
          {
            total_in: '0.0000',
            total_out: '0.0000',
            total_adjustment: '0.0000',
            current_stock: '0.0000',
            movement_count: '0',
          },
        ],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      };
    }
    if (sql.includes('COUNT(*) as count FROM stock_ledger')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM stock_ledger')) {
      return { rows: [mockLedgerEntry], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  };

  const createMockClient = () => {
    const mockClientQuery = vi.fn().mockImplementation(mockQueryFn);
    return {
      query: mockClientQuery,
      release: vi.fn(),
    } as unknown as PoolClient;
  };

  describe('Stock Ledger Immutability Guard', () => {
    it('should throw Error when update() is invoked on StockLedgerRepository', async () => {
      await expect((stockLedgerRepository as unknown as { update: () => Promise<unknown> }).update()).rejects.toThrow(
        'Stock ledger entries are immutable and cannot be updated',
      );
    });

    it('should throw Error when delete() is invoked on StockLedgerRepository', async () => {
      await expect(stockLedgerRepository.delete(orgAId, entryId)).rejects.toThrow(
        'Stock ledger entries are immutable and cannot be deleted',
      );
    });
  });

  describe('Stock Movements Creation & Precision', () => {
    it('should create stock IN movement preserving positive decimal quantity', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const entry = await stockLedgerRepository.create({
        organization_id: orgAId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'IN',
        quantity: '100.0000',
      });

      expect(entry.id).toBe(entryId);
      expect(entry.quantity).toBe('100.0000');
      expect(typeof entry.quantity).toBe('string');
    });

    it('should create stock OUT movement normalizing negative decimal quantity', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const entry = await stockLedgerRepository.create({
        organization_id: orgAId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'OUT',
        quantity: '25.5000',
      });

      expect(entry.quantity).toBe('-25.5000');
      expect(typeof entry.quantity).toBe('string');
    });

    it('should create ADJUSTMENT, TRANSFER_IN, and TRANSFER_OUT movements cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const transferIn = await stockLedgerRepository.create({
        organization_id: orgAId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'TRANSFER_IN',
        quantity: '50.0000',
      });
      expect(transferIn.quantity).toBe('50.0000');

      const transferOut = await stockLedgerRepository.create({
        organization_id: orgAId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'TRANSFER_OUT',
        quantity: '50.0000',
      });
      expect(transferOut.quantity).toBe('-50.0000');

      const adj = await stockLedgerRepository.create({
        organization_id: orgAId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'ADJUSTMENT',
        quantity: '-2.0000',
      });
      expect(adj.quantity).toBe('-2.0000');
    });
  });

  describe('Stock Ledger Lookups & Tenant Isolation', () => {
    it('should find entry by ID with tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const entry = await stockLedgerRepository.findById(orgAId, entryId);
      expect(entry).not.toBeNull();
      expect(entry?.id).toBe(entryId);

      const crossTenantEntry = await stockLedgerRepository.findById(orgBId, entryId);
      expect(crossTenantEntry).toBeNull();
    });

    it('should list movements by product, warehouse, product & warehouse, and reference', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byProduct = await stockLedgerRepository.listByProduct(orgAId, productId);
      expect(byProduct.items.length).toBe(1);

      const byWarehouse = await stockLedgerRepository.listByWarehouse(orgAId, warehouseId);
      expect(byWarehouse.items.length).toBe(1);

      const byProdWh = await stockLedgerRepository.listByProductAndWarehouse(orgAId, productId, warehouseId);
      expect(byProdWh.items.length).toBe(1);

      const byRef = await stockLedgerRepository.listByReference(orgAId, 'purchase_order', 'po-1111');
      expect(byRef.length).toBe(1);
    });
  });

  describe('Running Stock Calculation & Summary', () => {
    it('should calculate current stock using PostgreSQL NUMERIC sum', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const currentStock = await stockLedgerRepository.getCurrentStock(orgAId, productId, warehouseId);
      expect(currentStock).toBe('124.5000');
      expect(typeof currentStock).toBe('string');
    });

    it('should return movement summary statistics with exact decimal values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const summary = await stockLedgerRepository.getStockMovementSummary(orgAId, productId, warehouseId);
      expect(summary.total_in).toBe('150.0000');
      expect(summary.total_out).toBe('25.5000');
      expect(summary.current_stock).toBe('124.5000');
      expect(summary.movement_count).toBe(3);
    });
  });

  describe('Database Constraint Normalization', () => {
    it('should map invalid movement type to CheckConstraintViolationError (23514)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        stockLedgerRepository.create({
          organization_id: orgAId,
          product_id: productId,
          warehouse_id: warehouseId,
          movement_type: 'INVALID_TYPE' as unknown as 'IN',
          quantity: '10.0000',
        }),
      ).rejects.toThrow(CheckConstraintViolationError);
    });

    it('should map invalid product foreign key to ForeignKeyViolationError (23503)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        stockLedgerRepository.create({
          organization_id: orgAId,
          product_id: 'INVALID-PROD',
          warehouse_id: warehouseId,
          movement_type: 'IN',
          quantity: '10.0000',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);
    });
  });

  describe('Transaction Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic ledger movement creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await stockLedgerRepository.create(
          {
            organization_id: orgAId,
            product_id: productId,
            warehouse_id: warehouseId,
            movement_type: 'IN',
            quantity: '100.0000',
          },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['created_at', 'quantity'])).toThrow(
        ValidationError,
      );
    });
  });
});
