import { PoolClient } from 'pg';
import { PaginationParams, PaginatedResult } from './pagination';

export interface ReadRepository<T, Filter = Record<string, unknown>> {
  findById(organizationId: string, id: string, client?: PoolClient): Promise<T | null>;
  listByOrganization(
    organizationId: string,
    params?: Filter & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<T>>;
  exists(organizationId: string, id: string, client?: PoolClient): Promise<boolean>;
  count(organizationId: string, filter?: Filter, client?: PoolClient): Promise<number>;
}

export interface WriteRepository<T, CreateInput, UpdateInput> {
  create(data: CreateInput, client?: PoolClient): Promise<T>;
  update(
    organizationId: string,
    id: string,
    data: UpdateInput,
    client?: PoolClient,
  ): Promise<T | null>;
  delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean>;
}

export interface BaseRepositoryContract<
  T,
  CreateInput,
  UpdateInput,
  Filter = Record<string, unknown>,
> extends ReadRepository<T, Filter>,
    WriteRepository<T, CreateInput, UpdateInput> {}

export interface BaseFilterParams extends PaginationParams {
  query?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
