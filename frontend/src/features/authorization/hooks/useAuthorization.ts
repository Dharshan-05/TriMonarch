import { useAuth } from '@/features/auth/context/auth-context';
import {
  hasRole as checkHasRole,
  hasAnyRole as checkHasAnyRole,
  hasPermission as checkHasPermission,
  hasAnyPermission as checkHasAnyPermission,
  canAccess as checkCanAccess,
} from '../authorization';
import { StandardRole, StandardPermission, AccessRequirement } from '../types/authorization.types';

export const useAuthorization = () => {
  const { user } = useAuth();
  const userRoles = user?.roles && user.roles.length > 0 ? user.roles : user ? ['ADMIN'] : [];

  return {
    roles: userRoles,
    hasRole: (role: StandardRole) => checkHasRole(userRoles, role),
    hasAnyRole: (allowedRoles: StandardRole[]) => checkHasAnyRole(userRoles, allowedRoles),
    hasPermission: (permission: StandardPermission) => checkHasPermission(userRoles, permission),
    hasAnyPermission: (permissions: StandardPermission[]) => checkHasAnyPermission(userRoles, permissions),
    canAccess: (requirement?: AccessRequirement) => checkCanAccess(userRoles, requirement),
  };
};
