import { describe, it, expect, vi } from 'vitest';
import { customerRepository } from '../src/repositories/customer.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Partner Repository Subsystem (Phase 011)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const customerId = 'cust-1111';
  const supplierId = 'supp-2222';

  const mockCustomer = {
    id: customerId,
    organization_id: orgAId,
    name: 'Acme Corp Customer',
    email: 'contact@acme.com',
    phone: '+15550199',
    address: '123 Business Way',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSupplier = {
    id: supplierId,
    organization_id: orgAId,
    name: 'Global Logistics Supplier',
    email: 'supply@globallogistics.com',
    phone: '+15550288',
    address: '456 Supply Chain Blvd',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO customers')) {
      return { rows: [mockCustomer], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('INSERT INTO suppliers')) {
      return { rows: [mockSupplier], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM customers')) {
      const [id, orgId] = params as [string, string];
      if (id === customerId && orgId === orgAId) {
        return { rows: [{ id: customerId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM suppliers')) {
      const [id, orgId] = params as [string, string];
      if (id === supplierId && orgId === orgAId) {
        return { rows: [{ id: supplierId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM customers WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === customerId && orgId === orgAId) {
        return { rows: [mockCustomer], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM suppliers WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === supplierId && orgId === orgAId) {
        return { rows: [mockSupplier], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM customers')) {
      const [id, orgId] = params as [string, string];
      if (id === customerId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM suppliers')) {
      const [id, orgId] = params as [string, string];
      if (id === supplierId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM customers')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM suppliers')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE customers SET')) {
      return { rows: [mockCustomer], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE suppliers SET')) {
      return { rows: [mockSupplier], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM customers')) {
      return { rows: [mockCustomer], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM suppliers')) {
      return { rows: [mockSupplier], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('CustomerRepository Operations', () => {
    it('should create a customer entity cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await customerRepository.create({
        organization_id: orgAId,
        name: 'Acme Corp Customer',
        email: 'contact@acme.com',
      });

      expect(created.id).toBe(customerId);
      expect(created.name).toBe('Acme Corp Customer');
    });

    it('should find customer by ID with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const customer = await customerRepository.findById(orgAId, customerId);
      expect(customer).not.toBeNull();
      expect(customer?.id).toBe(customerId);
    });

    it('should update customer attributes', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await customerRepository.update(orgAId, customerId, { name: 'Acme Corp Updated' });
      expect(updated).not.toBeNull();
    });

    it('should delete customer returning boolean result', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await customerRepository.delete(orgAId, customerId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await customerRepository.delete(orgBId, customerId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check customer existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await customerRepository.exists(orgAId, customerId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await customerRepository.exists(orgBId, customerId);
      expect(existsOrgB).toBe(false);
    });

    it('should list and search customers with pagination metadata', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const result = await customerRepository.search(orgAId, {
        query: 'Acme',
        status: 'active',
        page: 1,
        pageSize: 10,
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('SupplierRepository Operations', () => {
    it('should create a supplier entity cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await supplierRepository.create({
        organization_id: orgAId,
        name: 'Global Logistics Supplier',
        email: 'supply@globallogistics.com',
      });

      expect(created.id).toBe(supplierId);
      expect(created.name).toBe('Global Logistics Supplier');
    });

    it('should find supplier by ID with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const supplier = await supplierRepository.findById(orgAId, supplierId);
      expect(supplier).not.toBeNull();
      expect(supplier?.id).toBe(supplierId);
    });

    it('should update supplier attributes', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await supplierRepository.update(orgAId, supplierId, { name: 'Global Logistics Updated' });
      expect(updated).not.toBeNull();
    });

    it('should delete supplier returning boolean result', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await supplierRepository.delete(orgAId, supplierId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await supplierRepository.delete(orgBId, supplierId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check supplier existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await supplierRepository.exists(orgAId, supplierId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await supplierRepository.exists(orgBId, supplierId);
      expect(existsOrgB).toBe(false);
    });

    it('should list and search suppliers with pagination metadata', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const result = await supplierRepository.search(orgAId, {
        query: 'Global',
        status: 'active',
        page: 1,
        pageSize: 10,
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('Multi-Tenant Cross-Tenant Isolation Test', () => {
    it('should deny cross-tenant customer & supplier access when using different organization_id', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossCustomer = await customerRepository.findById(orgBId, customerId);
      expect(crossCustomer).toBeNull();

      const crossSupplier = await supplierRepository.findById(orgBId, supplierId);
      expect(crossSupplier).toBeNull();
    });
  });

  describe('Transaction Client Propagation & SQL Injection Protection', () => {
    it('should propagate supplied PoolClient in withTransaction for both repositories', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await customerRepository.create(
          { organization_id: orgAId, name: 'Tx Customer' },
          txClient,
        );
        await supplierRepository.update(orgAId, supplierId, { name: 'Tx Supplier' }, txClient);
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['name', 'created_at'])).toThrow(
        ValidationError,
      );
    });
  });
});
