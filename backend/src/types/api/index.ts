export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    stack?: string;
  };
}
