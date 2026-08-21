import { useQuery } from '@tanstack/react-query';
import { productsService, ProductQueryParams } from '@/services/products.service';
import { queryKeys } from '@/queries/query-keys';

export const useProductsQuery = (params?: ProductQueryParams) => {
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
