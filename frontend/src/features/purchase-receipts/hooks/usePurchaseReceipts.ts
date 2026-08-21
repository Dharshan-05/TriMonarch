import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  purchaseReceiptsService,
  CreatePurchaseReceiptInput,
  PurchaseReceiptQueryParams,
} from '@/services/purchaseReceipts.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const usePurchaseReceiptsListQuery = (params?: PurchaseReceiptQueryParams) => {
  return useQuery({
    queryKey: queryKeys.purchaseReceipts.list(params),
    queryFn: () => purchaseReceiptsService.getPurchaseReceipts(params),
    staleTime: 60 * 1000,
  });
};

export const usePurchaseReceiptDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.purchaseReceipts.detail(id),
    queryFn: () => purchaseReceiptsService.getPurchaseReceiptById(id),
    enabled: Boolean(id),
  });
};

export const useCreatePurchaseReceiptMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreatePurchaseReceiptInput) => purchaseReceiptsService.createPurchaseReceipt(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      notify.success(`Goods Receipt '${res.receipt_number}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const usePostPurchaseReceiptMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseReceiptsService.postReceipt(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockLedger.all });
      notify.success(`Goods Receipt '${res.receipt_number}' posted and inventory updated.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useCompletePurchaseReceiptMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseReceiptsService.completeReceipt(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.detail(id) });
      notify.success(`Goods Receipt '${res.receipt_number}' marked complete.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useCancelPurchaseReceiptMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => purchaseReceiptsService.cancelReceipt(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseReceipts.detail(id) });
      notify.success(`Goods Receipt '${res.receipt_number}' cancelled.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
