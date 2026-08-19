import { partnerService } from './partner.service';
import { CreateSupplierInput, UpdateSupplierInput, Supplier } from '../types/database';
import { SupplierFilterParams } from '../repositories/supplier.repository';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class SupplierService {
  async createSupplier(data: CreateSupplierInput, userId?: string, requestId?: string): Promise<Supplier> {
    return partnerService.createSupplier(data, userId, requestId);
  }

  async getSupplierById(organizationId: string, id: string): Promise<Supplier> {
    return partnerService.getSupplierById(organizationId, id);
  }

  async listSuppliers(
    organizationId: string,
    params?: SupplierFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Supplier>> {
    return partnerService.listSuppliers(organizationId, params);
  }

  async searchSuppliers(
    organizationId: string,
    params?: SupplierFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Supplier>> {
    return partnerService.searchSuppliers(organizationId, params);
  }

  async updateSupplier(
    organizationId: string,
    id: string,
    data: UpdateSupplierInput,
    userId?: string,
    requestId?: string,
  ): Promise<Supplier> {
    return partnerService.updateSupplier(organizationId, id, data, userId, requestId);
  }

  async deleteSupplier(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return partnerService.deleteSupplier(organizationId, id, userId, requestId);
  }
}

export const supplierService = new SupplierService();
