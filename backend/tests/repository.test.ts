import { describe, it, expect, vi } from 'vitest';
import { buildPaginationClause, createPaginatedResult } from '../src/repositories/base/pagination';
import { organizationRepository } from '../src/repositories/organization.repository';
import { userRepository } from '../src/repositories/user.repository';
import * as queryModule from '../src/db/query';

describe('Base Pagination Utilities', () => {
  it('should sanitize page/pageSize and construct valid ORDER BY and LIMIT/OFFSET clauses', () => {
    const clause = buildPaginationClause({
      params: { page: 2, pageSize: 20, sortBy: 'name', sortOrder: 'asc' },
      allowedSortFields: ['name', 'code'],
      defaultSortBy: 'code',
    });

    expect(clause.page).toBe(2);
    expect(clause.pageSize).toBe(20);
    expect(clause.offset).toBe(20);
    expect(clause.sql).toBe('ORDER BY name ASC LIMIT 20 OFFSET 20');
  });

  it('should ignore unallowed sortBy fields to prevent SQL injection', () => {
    const clause = buildPaginationClause({
      params: { page: 1, pageSize: 10, sortBy: 'name; DROP TABLE users--', sortOrder: 'desc' },
      allowedSortFields: ['code'],
      defaultSortBy: 'code',
    });

    expect(clause.sql).toBe('ORDER BY code DESC LIMIT 10 OFFSET 0');
  });

  it('should construct paginated result payload correctly', () => {
    const result = createPaginatedResult(['item1', 'item2'], 25, 1, 10);
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });
});

describe('Entity Repositories', () => {
  it('OrganizationRepository.findById should call queryOne with organization ID', async () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
      code: 'TEST_ORG',
      description: null,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(queryModule, 'queryOne').mockResolvedValueOnce(mockOrg);

    const res = await organizationRepository.findById('org-123');
    expect(res).toEqual(mockOrg);
    expect(queryModule.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM organizations WHERE id = $1;',
      ['org-123'],
      undefined,
    );
  });

  it('UserRepository.findById should enforce organizationId scoping', async () => {
    const mockUser = {
      id: 'user-1',
      organization_id: 'org-100',
      name: 'John Tech',
      email: 'john@org100.com',
      phone: null,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(queryModule, 'queryOne').mockResolvedValueOnce(mockUser);

    const res = await userRepository.findById('org-100', 'user-1');
    expect(res).toEqual(mockUser);
    expect(queryModule.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2;',
      ['user-1', 'org-100'],
      undefined,
    );
  });
});
