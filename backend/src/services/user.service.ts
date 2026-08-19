import { userRepository } from '../repositories/user.repository';
import { CreateUserInput, UpdateUserInput, User } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class UserService {
  async createUser(data: CreateUserInput): Promise<User> {
    return userRepository.create(data);
  }

  async getUserById(organizationId: string, id: string): Promise<User> {
    const user = await userRepository.findById(organizationId, id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError(`User with email ${email} not found`);
    }
    return user;
  }

  async listUsersByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<User>> {
    return userRepository.listByOrganization(organizationId, params);
  }

  async updateUser(organizationId: string, id: string, data: UpdateUserInput): Promise<User> {
    await this.getUserById(organizationId, id);
    const updated = await userRepository.update(organizationId, id, data);
    return updated!;
  }

  async deleteUser(organizationId: string, id: string): Promise<boolean> {
    await this.getUserById(organizationId, id);
    return userRepository.delete(organizationId, id);
  }
}

export const userService = new UserService();
