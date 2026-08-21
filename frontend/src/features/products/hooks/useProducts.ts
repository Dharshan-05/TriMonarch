import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsService,
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
  ProductStatus,
} from '@/services/products.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useProductsListQuery = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsService.getProducts(params),
    staleTime: 60 * 1000,
  });
};

export const useProductDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsService.getProductById(id),
    enabled: Boolean(id),
  });
};

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreateProductInput) => productsService.createProduct(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success(`Product '${res.name}' (${res.sku}) created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productsService.updateProduct(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      notify.success(`Product '${res.name}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateProductStatusMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      productsService.updateProductStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      notify.success(`Product status updated to '${res.status || variables.status}'.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success('Product deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
