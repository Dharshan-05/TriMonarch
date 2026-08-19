import { departmentRepository } from '../repositories/department.repository';
import { CreateDepartmentInput, UpdateDepartmentInput, Department } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class DepartmentService {
  async createDepartment(data: CreateDepartmentInput): Promise<Department> {
    return departmentRepository.create(data);
  }

  async getDepartmentById(organizationId: string, id: string): Promise<Department> {
    const dept = await departmentRepository.findById(organizationId, id);
    if (!dept) {
      throw new NotFoundError(`Department with ID ${id} not found`);
    }
    return dept;
  }

  async listDepartmentsByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<Department>> {
    return departmentRepository.listByOrganization(organizationId, params);
  }

  async updateDepartment(
    organizationId: string,
    id: string,
    data: UpdateDepartmentInput,
  ): Promise<Department> {
    await this.getDepartmentById(organizationId, id);
    const updated = await departmentRepository.update(organizationId, id, data);
    return updated!;
  }

  async deleteDepartment(organizationId: string, id: string): Promise<boolean> {
    await this.getDepartmentById(organizationId, id);
    return departmentRepository.delete(organizationId, id);
  }
}

export const departmentService = new DepartmentService();
