import { organizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationInput, UpdateOrganizationInput, Organization } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class OrganizationService {
  async createOrganization(data: CreateOrganizationInput): Promise<Organization> {
    return organizationRepository.create(data);
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundError(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async getOrganizationByCode(code: string): Promise<Organization> {
    const org = await organizationRepository.findByCode(code);
    if (!org) {
      throw new NotFoundError(`Organization with code ${code} not found`);
    }
    return org;
  }

  async listOrganizations(params?: PaginationParams): Promise<PaginatedResult<Organization>> {
    return organizationRepository.list(params);
  }

  async updateOrganization(id: string, data: UpdateOrganizationInput): Promise<Organization> {
    await this.getOrganizationById(id);
    const updated = await organizationRepository.update(id, data);
    return updated!;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    await this.getOrganizationById(id);
    return organizationRepository.delete(id);
  }
}

export const organizationService = new OrganizationService();
