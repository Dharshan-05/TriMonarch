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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
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

export interface BaseQueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
