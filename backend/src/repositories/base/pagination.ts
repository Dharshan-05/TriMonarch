export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationOptions {
  params?: PaginationParams;
  allowedSortFields?: string[];
  defaultSortBy?: string;
}

export interface SQLPaginationClause {
  sql: string;
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}

export const buildPaginationClause = (options: PaginationOptions = {}): SQLPaginationClause => {
  const page = Math.max(1, options.params?.page || 1);
  const rawPageSize = options.params?.pageSize || 10;
  const pageSize = Math.min(100, Math.max(1, rawPageSize));
  const offset = (page - 1) * pageSize;

  let sortSql = '';
  const sortBy = options.params?.sortBy;
  const sortOrder = options.params?.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  if (sortBy && options.allowedSortFields && options.allowedSortFields.includes(sortBy)) {
    sortSql = `ORDER BY ${sortBy} ${sortOrder}`;
  } else if (options.defaultSortBy) {
    sortSql = `ORDER BY ${options.defaultSortBy} ${sortOrder}`;
  } else {
    sortSql = 'ORDER BY created_at DESC';
  }

  const sql = `${sortSql} LIMIT ${pageSize} OFFSET ${offset}`;

  return {
    sql,
    limit: pageSize,
    offset,
    page,
    pageSize,
  };
};

export const createPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
  };
};
