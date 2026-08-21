import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  warehousesService,
  WarehouseQueryParams,
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from '@/services/warehouses.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useWarehouseListQuery = (params?: WarehouseQueryParams) => {
  return useQuery({
    queryKey: queryKeys.warehouses.list(params),
    queryFn: () => warehousesService.getWarehouses(params),
  });
};

export const useWarehouseDetailQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => warehousesService.getWarehouseById(id),
    enabled: Boolean(id) && enabled,
  });
};

export const useCreateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return useMutation({
    mutationFn: (data: CreateWarehouseInput) => warehousesService.createWarehouse(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      notify.success(`Warehouse '${res.name}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseInput }) =>
      warehousesService.updateWarehouse(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.detail(updated.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      notify.success(`Warehouse '${updated.name}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
