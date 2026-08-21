import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { queryKeys } from '@/queries/query-keys';
import { UserQueryParams } from '@/services/users.service';

export const useUsersQuery = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.getUsers(params),
  });
};

export const useUserDetailQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersService.getUserById(id),
    enabled: Boolean(id),
  });
};
