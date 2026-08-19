import { partnerService } from './partner.service';
import { CreateCustomerInput, UpdateCustomerInput, Customer } from '../types/database';
import { CustomerFilterParams } from '../repositories/customer.repository';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class CustomerService {
  async createCustomer(data: CreateCustomerInput, userId?: string, requestId?: string): Promise<Customer> {
    return partnerService.createCustomer(data, userId, requestId);
  }

  async getCustomerById(organizationId: string, id: string): Promise<Customer> {
    return partnerService.getCustomerById(organizationId, id);
  }

  async listCustomers(
    organizationId: string,
    params?: CustomerFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Customer>> {
    return partnerService.listCustomers(organizationId, params);
  }

  async searchCustomers(
    organizationId: string,
    params?: CustomerFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Customer>> {
    return partnerService.searchCustomers(organizationId, params);
  }

  async updateCustomer(
    organizationId: string,
    id: string,
    data: UpdateCustomerInput,
    userId?: string,
    requestId?: string,
  ): Promise<Customer> {
    return partnerService.updateCustomer(organizationId, id, data, userId, requestId);
  }

  async deleteCustomer(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return partnerService.deleteCustomer(organizationId, id, userId, requestId);
  }
}

export const customerService = new CustomerService();
