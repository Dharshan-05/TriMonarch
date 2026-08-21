import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/queries/query-keys';
import { QueryClient } from '@tanstack/react-query';

describe('Query Key Factory & Cache Invalidation', () => {
  it('generates deterministic query keys with parameters', () => {
    const listKey1 = queryKeys.products.list({ page: 1, pageSize: 20 });
    const listKey2 = queryKeys.products.list({ page: 1, pageSize: 20 });
    const detailKey = queryKeys.products.detail('prd-123');

    expect(listKey1).toEqual(['products', 'list', { page: 1, pageSize: 20 }]);
    expect(listKey1).toEqual(listKey2);
    expect(detailKey).toEqual(['products', 'detail', 'prd-123']);
  });

  it('maintains strict namespace isolation between modules', () => {
    const productKey = queryKeys.products.all;
    const inventoryKey = queryKeys.inventory.all;
    const userKey = queryKeys.users.all;

    expect(productKey).toEqual(['products']);
    expect(inventoryKey).toEqual(['inventory']);
    expect(userKey).toEqual(['users']);
    expect(productKey).not.toEqual(inventoryKey);
  });

  it('supports targeted cache data updates and invalidations', async () => {
    const testQueryClient = new QueryClient();
    const key = queryKeys.products.detail('prd-1');

    testQueryClient.setQueryData(key, { id: 'prd-1', name: 'Test Product' });
    expect(testQueryClient.getQueryData(key)).toEqual({ id: 'prd-1', name: 'Test Product' });

    await testQueryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    expect(testQueryClient.isFetching({ queryKey: queryKeys.products.all })).toBe(0);
  });
});
