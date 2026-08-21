export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiMeta {
  requestId?: string;
  apiVersion?: string;
  timestamp?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: ApiMeta & {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    pagination?: PaginationMeta;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T>;
