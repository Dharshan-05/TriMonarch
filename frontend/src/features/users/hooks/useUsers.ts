import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, CreateUserInput, UpdateUserInput, UserStatus, UserQueryParams } from '@/services/users.service';
import { queryKeys } from '@/queries/query-keys';
import { useToast } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';

export const useUsersListQuery = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.getUsers(params),
    staleTime: 60 * 1000,
  });
};

export const useUserDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersService.getUserById(id),
    enabled: Boolean(id),
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (data: CreateUserInput) => usersService.createUser(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success(`User '${res.email}' created successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) => usersService.updateUser(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      notify.success(`User '${res.email}' updated successfully.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useUpdateUserStatusMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersService.updateUserStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      notify.success(`User status changed to '${res.status || variables.status}'.`);
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  return useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('User account deleted successfully.');
    },
    onError: (err) => {
      const formatted = formatApiError(err);
      notify.error(formatted.message, formatted.title);
    },
  });
};
