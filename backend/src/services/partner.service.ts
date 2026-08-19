import { customerRepository, CustomerFilterParams } from '../repositories/customer.repository';
import { supplierRepository, SupplierFilterParams } from '../repositories/supplier.repository';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  Customer,
  CreateSupplierInput,
  UpdateSupplierInput,
  Supplier,
} from '../types/database';
import { NotFoundError, ValidationError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { computeDiff } from '../audit/audit.utils';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer.schema';
import { createSupplierSchema, updateSupplierSchema } from '../schemas/supplier.schema';

export class PartnerService {
  // =========================================================================
  // CUSTOMER WORKFLOWS
  // =========================================================================

  async createCustomer(data: CreateCustomerInput, userId?: string, requestId?: string): Promise<Customer> {
    const parseResult = createCustomerSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid customer payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    const normalizedName = validated.name.trim();
    const normalizedEmail = validated.email ? validated.email.trim().toLowerCase() : null;
    const normalizedPhone = validated.phone ? validated.phone.trim() : null;
    const normalizedAddress = validated.address ? validated.address.trim() : null;

    return withTransaction(async (tx) => {
      const inputPayload: CreateCustomerInput = {
        ...validated,
        organization_id: organizationId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: normalizedAddress,
      };

      const cust = await customerRepository.create(inputPayload, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'CUSTOMER',
          entity_id: cust.id,
          request_id: requestId,
          success: true,
          metadata: { name: cust.name, email: cust.email, phone: cust.phone, status: cust.status },
        },
        tx,
      );

      return cust;
    });
  }

  async getCustomerById(organizationId: string, id: string): Promise<Customer> {
    const cust = await customerRepository.findById(organizationId, id);
    if (!cust) {
      throw new NotFoundError(`Customer with ID ${id} not found`);
    }
    return cust;
  }

  async listCustomers(
    organizationId: string,
    params?: CustomerFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Customer>> {
    return customerRepository.search(organizationId, params || {});
  }

  async searchCustomers(
    organizationId: string,
    params?: CustomerFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Customer>> {
    return customerRepository.search(organizationId, params || {});
  }

  async updateCustomer(
    organizationId: string,
    id: string,
    data: UpdateCustomerInput,
    userId?: string,
    requestId?: string,
  ): Promise<Customer> {
    const parseResult = updateCustomerSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid customer update payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    return withTransaction(async (tx) => {
      const existing = await customerRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }

      const updatePayload: UpdateCustomerInput = { ...validated };

      if (validated.name !== undefined) {
        updatePayload.name = validated.name.trim();
      }
      if (validated.email !== undefined) {
        updatePayload.email = validated.email ? validated.email.trim().toLowerCase() : null;
      }
      if (validated.phone !== undefined) {
        updatePayload.phone = validated.phone ? validated.phone.trim() : null;
      }
      if (validated.address !== undefined) {
        updatePayload.address = validated.address ? validated.address.trim() : null;
      }

      const updated = (await customerRepository.update(organizationId, id, updatePayload, tx))!;
      const diff = computeDiff(
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      );

      if (Object.keys(diff).length > 0) {
        await auditService.recordAuditEvent(
          {
            organization_id: organizationId,
            user_id: userId,
            action: 'UPDATE',
            entity_type: 'CUSTOMER',
            entity_id: id,
            request_id: requestId,
            success: true,
            metadata: { changes: diff },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async deleteCustomer(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existing = await customerRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }

      const deleted = await customerRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'CUSTOMER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: { deleted: { name: existing.name, email: existing.email } },
        },
        tx,
      );

      return deleted;
    });
  }

  // =========================================================================
  // SUPPLIER WORKFLOWS
  // =========================================================================

  async createSupplier(data: CreateSupplierInput, userId?: string, requestId?: string): Promise<Supplier> {
    const parseResult = createSupplierSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid supplier payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    const normalizedName = validated.name.trim();
    const normalizedEmail = validated.email ? validated.email.trim().toLowerCase() : null;
    const normalizedPhone = validated.phone ? validated.phone.trim() : null;
    const normalizedAddress = validated.address ? validated.address.trim() : null;

    return withTransaction(async (tx) => {
      const inputPayload: CreateSupplierInput = {
        ...validated,
        organization_id: organizationId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: normalizedAddress,
      };

      const supp = await supplierRepository.create(inputPayload, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'SUPPLIER',
          entity_id: supp.id,
          request_id: requestId,
          success: true,
          metadata: { name: supp.name, email: supp.email, phone: supp.phone, status: supp.status },
        },
        tx,
      );

      return supp;
    });
  }

  async getSupplierById(organizationId: string, id: string): Promise<Supplier> {
    const supp = await supplierRepository.findById(organizationId, id);
    if (!supp) {
      throw new NotFoundError(`Supplier with ID ${id} not found`);
    }
    return supp;
  }

  async listSuppliers(
    organizationId: string,
    params?: SupplierFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Supplier>> {
    return supplierRepository.search(organizationId, params || {});
  }

  async searchSuppliers(
    organizationId: string,
    params?: SupplierFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Supplier>> {
    return supplierRepository.search(organizationId, params || {});
  }

  async updateSupplier(
    organizationId: string,
    id: string,
    data: UpdateSupplierInput,
    userId?: string,
    requestId?: string,
  ): Promise<Supplier> {
    const parseResult = updateSupplierSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid supplier update payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    return withTransaction(async (tx) => {
      const existing = await supplierRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Supplier with ID ${id} not found`);
      }

      const updatePayload: UpdateSupplierInput = { ...validated };

      if (validated.name !== undefined) {
        updatePayload.name = validated.name.trim();
      }
      if (validated.email !== undefined) {
        updatePayload.email = validated.email ? validated.email.trim().toLowerCase() : null;
      }
      if (validated.phone !== undefined) {
        updatePayload.phone = validated.phone ? validated.phone.trim() : null;
      }
      if (validated.address !== undefined) {
        updatePayload.address = validated.address ? validated.address.trim() : null;
      }

      const updated = (await supplierRepository.update(organizationId, id, updatePayload, tx))!;
      const diff = computeDiff(
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      );

      if (Object.keys(diff).length > 0) {
        await auditService.recordAuditEvent(
          {
            organization_id: organizationId,
            user_id: userId,
            action: 'UPDATE',
            entity_type: 'SUPPLIER',
            entity_id: id,
            request_id: requestId,
            success: true,
            metadata: { changes: diff },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async deleteSupplier(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existing = await supplierRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Supplier with ID ${id} not found`);
      }

      const deleted = await supplierRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'SUPPLIER',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: { deleted: { name: existing.name, email: existing.email } },
        },
        tx,
      );

      return deleted;
    });
  }
}

export const partnerService = new PartnerService();
