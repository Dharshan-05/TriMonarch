import { useQuery } from '@tanstack/react-query';
import { partnersService, PartnerQueryParams, PartnerType } from '@/services/partners.service';
import { queryKeys } from '@/queries/query-keys';

export const usePartnersQuery = (params?: PartnerQueryParams) => {
  return useQuery({
    queryKey: queryKeys.partners.list(params),
    queryFn: () => partnersService.getPartners(params),
    staleTime: 60 * 1000,
  });
};

export const usePartnerDetailQuery = (id: string, type?: PartnerType) => {
  return useQuery({
    queryKey: queryKeys.partners.detail(id),
    queryFn: () => partnersService.getPartnerById(id, type),
    enabled: Boolean(id),
  });
};
