import { roleRepository } from '../repositories/role.repository';
import { CreateRoleInput, UpdateRoleInput, Role } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class RoleService {
  async createRole(data: CreateRoleInput): Promise<Role> {
    return roleRepository.create(data);
  }

  async getRoleById(organizationId: string, id: string): Promise<Role> {
    const role = await roleRepository.findById(organizationId, id);
    if (!role) {
      throw new NotFoundError(`Role with ID ${id} not found`);
    }
    return role;
  }

  async listRolesByOrganization(
    organizationId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Role>> {
    return roleRepository.listByOrganization(organizationId, params);
  }

  async updateRole(organizationId: string, id: string, data: UpdateRoleInput): Promise<Role> {
    await this.getRoleById(organizationId, id);
    const updated = await roleRepository.update(organizationId, id, data);
    return updated!;
  }

  async deleteRole(organizationId: string, id: string): Promise<boolean> {
    await this.getRoleById(organizationId, id);
    return roleRepository.delete(organizationId, id);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    return roleRepository.assignRoleToUser(userId, roleId);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    return roleRepository.removeRoleFromUser(userId, roleId);
  }

  async listUserRoles(userId: string): Promise<Role[]> {
    return roleRepository.listUserRoles(userId);
  }
}

export const roleService = new RoleService();
