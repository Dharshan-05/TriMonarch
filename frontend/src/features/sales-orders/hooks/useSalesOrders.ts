import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  salesOrdersService,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  SalesOrderStatus,
  SalesOrderQueryParams,
} from '@/services/salesOrders.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useSalesOrdersListQuery = (params?: SalesOrderQueryParams) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.list(params),
    queryFn: () => salesOrdersService.getSalesOrders(params),
    staleTime: 60 * 1000,
  });
};

export const useSalesOrderDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salesOrders.detail(id),
    queryFn: () => salesOrdersService.getSalesOrderById(id),
    enabled: Boolean(id),
  });
};

export const useCreateSalesOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreateSalesOrderInput) => salesOrdersService.createSalesOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      notify.success(`Sales Order '${res.order_number}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateSalesOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesOrderInput }) =>
      salesOrdersService.updateSalesOrder(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(variables.id) });
      notify.success(`Sales Order '${res.order_number}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateSalesOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SalesOrderStatus }) =>
      salesOrdersService.updateSalesOrderStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockLedger.all });
      notify.success(`Sales Order status changed to '${res.status || variables.status}'.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeleteSalesOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesOrdersService.deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      notify.success('Sales Order cancelled/deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
