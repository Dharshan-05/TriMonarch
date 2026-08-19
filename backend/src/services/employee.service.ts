import { employeeRepository } from '../repositories/employee.repository';
import { CreateEmployeeInput, UpdateEmployeeInput, Employee } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class EmployeeService {
  async createEmployee(data: CreateEmployeeInput): Promise<Employee> {
    return employeeRepository.create(data);
  }

  async getEmployeeById(organizationId: string, id: string): Promise<Employee> {
    const emp = await employeeRepository.findById(organizationId, id);
    if (!emp) {
      throw new NotFoundError(`Employee with ID ${id} not found`);
    }
    return emp;
  }

  async listEmployeesByOrganization(
    organizationId: string,
    params?: PaginationParams & { departmentId?: string; status?: string },
  ): Promise<PaginatedResult<Employee>> {
    return employeeRepository.listByOrganization(organizationId, params);
  }

  async updateEmployee(
    organizationId: string,
    id: string,
    data: UpdateEmployeeInput,
  ): Promise<Employee> {
    await this.getEmployeeById(organizationId, id);
    const updated = await employeeRepository.update(organizationId, id, data);
    return updated!;
  }

  async deleteEmployee(organizationId: string, id: string): Promise<boolean> {
    await this.getEmployeeById(organizationId, id);
    return employeeRepository.delete(organizationId, id);
  }
}

export const employeeService = new EmployeeService();
