import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrdersService,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderQueryParams,
} from '@/services/purchaseOrders.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const usePurchaseOrdersListQuery = (params?: PurchaseOrderQueryParams) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.list(params),
    queryFn: () => purchaseOrdersService.getPurchaseOrders(params),
    staleTime: 60 * 1000,
  });
};

export const usePurchaseOrderDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.detail(id),
    queryFn: () => purchaseOrdersService.getPurchaseOrderById(id),
    enabled: Boolean(id),
  });
};

export const useCreatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderInput) => purchaseOrdersService.createPurchaseOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      notify.success(`Purchase Order '${res.order_number}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderInput }) =>
      purchaseOrdersService.updatePurchaseOrder(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(variables.id) });
      notify.success(`Purchase Order '${res.order_number}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useSubmitPurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.submitPurchaseOrder(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(id) });
      notify.success(`Purchase Order '${res.order_number}' submitted for approval.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useApprovePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.approvePurchaseOrder(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      notify.success(`Purchase Order '${res.order_number}' approved successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useCancelPurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.cancelPurchaseOrder(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(id) });
      notify.success(`Purchase Order '${res.order_number}' cancelled.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeletePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      notify.success('Purchase Order deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
