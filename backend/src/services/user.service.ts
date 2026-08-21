import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { hashPassword } from '../utils/password';
import { CreateUserInput, UpdateUserInput, User } from '../types/database';
import { NotFoundError, ConflictError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';
import { businessEventService } from './businessEvent.service';

export interface ExtendedCreateUserInput extends CreateUserInput {
  password?: string;
  role?: string;
}

export class UserService {
  async createUser(data: ExtendedCreateUserInput, requestId?: string): Promise<User> {
    const existing = await userRepository.findByEmail(data.organization_id, data.email);
    if (existing) {
      throw new ConflictError(`User with email '${data.email}' already exists`, 'USER_ALREADY_EXISTS');
    }

    const user = await userRepository.create(data);

    if (data.password) {
      const passwordHash = await hashPassword(data.password);
      await userRepository.updatePasswordHash(user.id, passwordHash);
    }

    if (data.role) {
      const role = await roleRepository.findByCode(data.organization_id, data.role.toUpperCase());
      if (role) {
        await roleRepository.assignRoleToUser(user.id, role.id);
      }
    }

    await businessEventService.emit({
      eventName: 'USER_CREATED',
      organization_id: data.organization_id,
      user_id: user.id,
      request_id: requestId,
      metadata: { email: user.email, name: user.name },
    });

    return user;
  }

  async getUserById(organizationId: string, id: string): Promise<User> {
    const user = await userRepository.findById(organizationId, id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND');
    }
    return user;
  }

  async getUserByEmail(organizationId: string, email: string): Promise<User> {
    const user = await userRepository.findByEmail(organizationId, email);
    if (!user) {
      throw new NotFoundError(`User with email ${email} not found`, 'USER_NOT_FOUND');
    }
    return user;
  }

  async listUsersByOrganization(
    organizationId: string,
    params?: PaginationParams & { query?: string; search?: string; status?: string },
  ): Promise<PaginatedResult<User>> {
    const query = params?.search || params?.query;
    return userRepository.listByOrganization(organizationId, { ...params, query });
  }

  async updateUser(
    organizationId: string,
    id: string,
    data: UpdateUserInput,
    requestId?: string,
  ): Promise<User> {
    await this.getUserById(organizationId, id);
    const updated = await userRepository.update(organizationId, id, data);

    await businessEventService.emit({
      eventName: 'USER_UPDATED',
      organization_id: organizationId,
      user_id: id,
      request_id: requestId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated!;
  }

  async updateUserStatus(
    organizationId: string,
    id: string,
    status: string,
    requestId?: string,
  ): Promise<User> {
    await this.getUserById(organizationId, id);
    const typedStatus = status as User['status'];
    const updated = await userRepository.update(organizationId, id, { status: typedStatus });

    await businessEventService.emit({
      eventName: 'USER_STATUS_CHANGED',
      organization_id: organizationId,
      user_id: id,
      request_id: requestId,
      metadata: { newStatus: status },
    });

    return updated!;
  }

  async deleteUser(organizationId: string, id: string, requestId?: string): Promise<boolean> {
    await this.getUserById(organizationId, id);
    const result = await userRepository.update(organizationId, id, { status: 'inactive' });

    if (result) {
      await businessEventService.emit({
        eventName: 'USER_DELETED',
        organization_id: organizationId,
        user_id: id,
        request_id: requestId,
      });
      return true;
    }
    return false;
  }
}

export const userService = new UserService();
