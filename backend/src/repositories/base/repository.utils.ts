import { ValidationError } from '../../types';

export const sanitizeSortColumn = (
  sortBy: string | undefined,
  allowedFields: string[],
  defaultField = 'created_at',
): string => {
  if (!sortBy) {
    return defaultField;
  }
  if (!allowedFields.includes(sortBy)) {
    throw new ValidationError(`Invalid sort field: '${sortBy}'. Allowed fields: ${allowedFields.join(', ')}`);
  }
  return sortBy;
};

export const sanitizeSortOrder = (sortOrder: string | undefined): 'ASC' | 'DESC' => {
  if (!sortOrder) {
    return 'DESC';
  }
  const normalized = sortOrder.trim().toUpperCase();
  if (normalized === 'ASC' || normalized === 'DESC') {
    return normalized;
  }
  throw new ValidationError(`Invalid sort order: '${sortOrder}'. Must be 'asc' or 'desc'`);
};

export const formatLikeSearch = (term: string): string => {
  // Escape special PostgreSQL LIKE wildcard characters % and _
  const escaped = term.replace(/[%_]/g, '\\$&');
  return `%${escaped}%`;
};

export const buildWhereClause = (conditions: string[]): string => {
  if (conditions.length === 0) {
    return '';
  }
  return `WHERE ${conditions.join(' AND ')}`;
};
