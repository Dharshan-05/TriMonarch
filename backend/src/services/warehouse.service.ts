import { warehouseRepository } from '../repositories/warehouse.repository';
import { CreateWarehouseInput, UpdateWarehouseInput, Warehouse } from '../types/database';
import { NotFoundError } from '../types';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';

export class WarehouseService {
  async createWarehouse(data: CreateWarehouseInput): Promise<Warehouse> {
    return warehouseRepository.create(data);
  }

  async getWarehouseById(organizationId: string, id: string): Promise<Warehouse> {
    const wh = await warehouseRepository.findById(organizationId, id);
    if (!wh) {
      throw new NotFoundError(`Warehouse with ID ${id} not found`);
    }
    return wh;
  }

  async listWarehousesByOrganization(
    organizationId: string,
    params?: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<Warehouse>> {
    return warehouseRepository.listByOrganization(organizationId, params);
  }

  async updateWarehouse(
    organizationId: string,
    id: string,
    data: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    await this.getWarehouseById(organizationId, id);
    const updated = await warehouseRepository.update(organizationId, id, data);
    return updated!;
  }

  async deleteWarehouse(organizationId: string, id: string): Promise<boolean> {
    await this.getWarehouseById(organizationId, id);
    return warehouseRepository.delete(organizationId, id);
  }
}

export const warehouseService = new WarehouseService();
