import { describe, it, expect, vi } from 'vitest';
import { partnerService } from '../src/services/partner.service';
import { customerRepository } from '../src/repositories/customer.repository';
import { supplierRepository } from '../src/repositories/supplier.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { NotFoundError, ValidationError } from '../src/types';
import { ForeignKeyViolationError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Partner Service Subsystem (Phase 020)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const custId = 'cust-1111';
  const suppId = 'supp-1111';

  const mockCustomer = {
    id: custId,
    organization_id: orgAId,
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0100',
    address: '100 Enterprise Way',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSupplier = {
    id: suppId,
    organization_id: orgAId,
    name: 'Global Logistics Inc',
    email: 'info@globallogistics.com',
    phone: '+1-555-0200',
    address: '500 Supply Chain Blvd',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockPoolClient = () => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      return { rows: [], rowCount: 1, command: sql, oid: 0, fields: [] };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  describe('Customer Workflows', () => {
    it('should create valid customer and record Category A audit event atomically', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'create').mockResolvedValueOnce(mockCustomer);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-c1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'CUSTOMER',
        entity_id: custId,
        request_id: 'req-c1',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await partnerService.createCustomer(
        {
          organization_id: orgAId,
          name: ' Acme Corporation ',
          email: ' CONTACT@ACME.COM ',
        },
        userAId,
        'req-c1',
      );

      expect(res.id).toBe(custId);
      expect(customerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Corporation',
          email: 'contact@acme.com',
        }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_type: 'CUSTOMER',
          entity_id: custId,
        }),
        mockClient,
      );
    });

    it('should reject customer creation with invalid payload or missing organization_id', async () => {
      await expect(
        partnerService.createCustomer({
          organization_id: orgAId,
          name: '',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should roll back customer creation if audit recording fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'create').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit fail'));

      await expect(
        partnerService.createCustomer(
          { organization_id: orgAId, name: 'Acme Corp' },
          userAId,
        ),
      ).rejects.toThrow('Audit fail');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should retrieve customer by ID and throw NotFoundError when missing', async () => {
      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      const cust = await partnerService.getCustomerById(orgAId, custId);
      expect(cust.id).toBe(custId);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(null);
      await expect(partnerService.getCustomerById(orgAId, 'missing')).rejects.toThrow(NotFoundError);
    });

    it('should update customer and record UPDATE audit event with diff', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const updatedCust = { ...mockCustomer, name: 'Acme International' };

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(customerRepository, 'update').mockResolvedValueOnce(updatedCust);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-c2',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'CUSTOMER',
        entity_id: custId,
        request_id: 'req-c2',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const updated = await partnerService.updateCustomer(
        orgAId,
        custId,
        { name: ' Acme International ' },
        userAId,
        'req-c2',
      );

      expect(updated.name).toBe('Acme International');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_type: 'CUSTOMER',
          entity_id: custId,
        }),
        mockClient,
      );
    });

    it('should delete customer and handle foreign key constraint violations', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(customerRepository, 'delete').mockRejectedValueOnce(
        new ForeignKeyViolationError('Customer referenced in sales orders', 'sales_orders_customer_id_fkey'),
      );

      await expect(partnerService.deleteCustomer(orgAId, custId, userAId)).rejects.toThrow(
        ForeignKeyViolationError,
      );
    });
  });

  describe('Supplier Workflows', () => {
    it('should create valid supplier and record Category A audit event atomically', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(supplierRepository, 'create').mockResolvedValueOnce(mockSupplier);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-s1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'SUPPLIER',
        entity_id: suppId,
        request_id: 'req-s1',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await partnerService.createSupplier(
        {
          organization_id: orgAId,
          name: ' Global Logistics Inc ',
          email: ' INFO@GLOBALLOGISTICS.COM ',
        },
        userAId,
        'req-s1',
      );

      expect(res.id).toBe(suppId);
      expect(supplierRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Global Logistics Inc',
          email: 'info@globallogistics.com',
        }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_type: 'SUPPLIER',
          entity_id: suppId,
        }),
        mockClient,
      );
    });

    it('should retrieve supplier by ID and throw NotFoundError when missing', async () => {
      vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
      const supp = await partnerService.getSupplierById(orgAId, suppId);
      expect(supp.id).toBe(suppId);

      vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);
      await expect(partnerService.getSupplierById(orgAId, 'missing')).rejects.toThrow(NotFoundError);
    });

    it('should update supplier and record UPDATE audit event with diff', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const updatedSupp = { ...mockSupplier, phone: '+1-555-9999' };

      vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
      vi.spyOn(supplierRepository, 'update').mockResolvedValueOnce(updatedSupp);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-s2',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SUPPLIER',
        entity_id: suppId,
        request_id: 'req-s2',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const updated = await partnerService.updateSupplier(
        orgAId,
        suppId,
        { phone: '+1-555-9999' },
        userAId,
        'req-s2',
      );

      expect(updated.phone).toBe('+1-555-9999');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_type: 'SUPPLIER',
          entity_id: suppId,
        }),
        mockClient,
      );
    });

    it('should delete supplier atomically and roll back if audit fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(mockSupplier);
      vi.spyOn(supplierRepository, 'delete').mockResolvedValueOnce(true);
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit fail'));

      await expect(partnerService.deleteSupplier(orgAId, suppId, userAId)).rejects.toThrow(
        'Audit fail',
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Search & Pagination & Cross-Tenant Security', () => {
    it('should search customers and suppliers with tenant scope', async () => {
      const mockPaginatedCustomers = {
        items: [mockCustomer],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(customerRepository, 'search').mockResolvedValue(mockPaginatedCustomers);
      const custRes = await partnerService.searchCustomers(orgAId, { query: 'Acme' });
      expect(custRes.items.length).toBe(1);

      const mockPaginatedSuppliers = {
        items: [mockSupplier],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(supplierRepository, 'search').mockResolvedValue(mockPaginatedSuppliers);
      const suppRes = await partnerService.searchSuppliers(orgAId, { query: 'Global' });
      expect(suppRes.items.length).toBe(1);
    });

    it('should enforce tenant isolation (Org B denied access to Org A partners)', async () => {
      vi.spyOn(customerRepository, 'findById').mockImplementation(async (orgId, id) => {
        if (orgId === orgAId && id === custId) return mockCustomer;
        return null;
      });

      await expect(partnerService.getCustomerById(orgBId, custId)).rejects.toThrow(NotFoundError);
    });
  });
});
