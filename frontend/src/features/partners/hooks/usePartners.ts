import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  partnersService,
  CreatePartnerInput,
  UpdatePartnerInput,
  PartnerQueryParams,
  PartnerType,
} from '@/services/partners.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const usePartnersListQuery = (params?: PartnerQueryParams) => {
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

export const useCreatePartnerMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreatePartnerInput) => partnersService.createPartner(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.all });
      notify.success(`Partner '${res.name}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdatePartnerMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerInput }) =>
      partnersService.updatePartner(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.detail(variables.id) });
      notify.success(`Partner '${res.name}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeletePartnerMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type?: PartnerType }) =>
      partnersService.deletePartner(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.all });
      notify.success('Partner deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
