import { StandardRole, StandardPermission, ROLE_PERMISSIONS, AccessRequirement } from './types/authorization.types';

export const hasRole = (userRoles?: string[], requiredRole?: StandardRole): boolean => {
  if (!requiredRole) return true;
  if (!userRoles || userRoles.length === 0) return false;
  const normUserRoles = userRoles.map((r) => r.toUpperCase());
  if (normUserRoles.includes('SUPER_ADMIN')) return true;
  return normUserRoles.includes(requiredRole.toUpperCase());
};

export const hasAnyRole = (userRoles?: string[], allowedRoles?: StandardRole[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;
  const normUserRoles = userRoles.map((r) => r.toUpperCase());
  if (normUserRoles.includes('SUPER_ADMIN')) return true;
  const normAllowed = allowedRoles.map((r) => r.toUpperCase());
  return normAllowed.some((role) => normUserRoles.includes(role));
};

export const hasPermission = (userRoles?: string[], requiredPermission?: StandardPermission): boolean => {
  if (!requiredPermission) return true;
  if (!userRoles || userRoles.length === 0) return false;
  const normUserRoles = userRoles.map((r) => r.toUpperCase());

  if (normUserRoles.includes('SUPER_ADMIN') || normUserRoles.includes('ADMIN')) return true;

  for (const roleCode of normUserRoles) {
    const perms = ROLE_PERMISSIONS[roleCode as StandardRole];
    if (perms && perms.includes(requiredPermission)) {
      return true;
    }
  }

  return false;
};

export const hasAnyPermission = (userRoles?: string[], requiredPermissions?: StandardPermission[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.some((perm) => hasPermission(userRoles, perm));
};

export const canAccess = (userRoles?: string[], requirement?: AccessRequirement): boolean => {
  if (!requirement) return true;
  const roleOk = !requirement.roles || hasAnyRole(userRoles, requirement.roles);
  const permOk = !requirement.permissions || hasAnyPermission(userRoles, requirement.permissions);
  return roleOk && permOk;
};
