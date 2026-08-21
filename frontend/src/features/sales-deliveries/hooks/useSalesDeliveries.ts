import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  salesDeliveriesService,
  CreateSalesDeliveryInput,
  SalesDeliveryQueryParams,
} from '@/services/salesDeliveries.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useSalesDeliveriesListQuery = (params?: SalesDeliveryQueryParams) => {
  return useQuery({
    queryKey: queryKeys.salesDeliveries.list(params),
    queryFn: () => salesDeliveriesService.getDeliveries(params),
    staleTime: 60 * 1000,
  });
};

export const useSalesDeliveryDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salesDeliveries.detail(id),
    queryFn: () => salesDeliveriesService.getDeliveryById(id),
    enabled: Boolean(id),
  });
};

export const useCreateSalesDeliveryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreateSalesDeliveryInput) => salesDeliveriesService.createDelivery(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      notify.success(`Sales Delivery '${res.delivery_number}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useConfirmSalesDeliveryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.confirmDelivery(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      notify.success(`Sales Delivery '${res.delivery_number}' confirmed.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useStartPickingMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.startPicking(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      notify.success(`Sales Delivery '${res.delivery_number}' status updated to Picking.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useMarkPackedMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.markPacked(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      notify.success(`Sales Delivery '${res.delivery_number}' marked Packed.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useShipSalesDeliveryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.shipDelivery(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      notify.success(`Sales Delivery '${res.delivery_number}' shipped successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeliverSalesDeliveryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.deliverDelivery(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockLedger.all });
      notify.success(`Sales Delivery '${res.delivery_number}' marked Delivered and inventory updated.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useCancelSalesDeliveryMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => salesDeliveriesService.cancelDelivery(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesDeliveries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      notify.success(`Sales Delivery '${res.delivery_number}' cancelled.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
