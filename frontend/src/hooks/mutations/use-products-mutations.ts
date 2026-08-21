import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, CreateProductInput, UpdateProductInput } from '@/services/products.service';
import { queryKeys } from '@/queries/query-keys';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => productsService.createProduct(data),
    onSuccess: () => {
      // Invalidate products list cache so UI auto-refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productsService.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      // Targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(updatedProduct.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};
