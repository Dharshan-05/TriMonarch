import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  CreateInventoryInput,
  UpdateInventoryInput,
  AdjustInventoryInput,
  InventoryQueryParams,
} from '@/services/inventory.service';
import { queryKeys } from '@/queries/query-keys';
import { BaseQueryParams } from '@/types/api';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useInventoryListQuery = (params?: InventoryQueryParams) => {
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

export const useCreateInventoryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreateInventoryInput) => inventoryService.createInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      notify.success('Inventory balance record created successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateInventoryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryInput }) =>
      inventoryService.updateInventory(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.id) });
      notify.success('Inventory record updated successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useAdjustStockMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustInventoryInput }) =>
      inventoryService.adjustInventory(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.id) });
      notify.success('Stock level adjusted and ledger movement posted.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeleteInventoryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      notify.success('Inventory record deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useInventoryMovementsQuery = (id: string, params?: BaseQueryParams) => {
  return useQuery({
    queryKey: ['inventory', 'movements', id, params],
    queryFn: () => inventoryService.getInventoryMovements(id, params),
    enabled: Boolean(id),
  });
};
