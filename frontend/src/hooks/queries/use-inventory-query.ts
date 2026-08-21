import { useQuery } from '@tanstack/react-query';
import { inventoryService, InventoryQueryParams } from '@/services/inventory.service';
import { queryKeys } from '@/queries/query-keys';

export const useInventoryQuery = (params?: InventoryQueryParams) => {
  return useQuery({
    queryKey: queryKeys.inventory.list(params),
    queryFn: () => inventoryService.getInventory(params),
    staleTime: 60 * 1000,
  });
};

export const useInventoryDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: () => inventoryService.getInventoryById(id),
    enabled: Boolean(id),
  });
};
