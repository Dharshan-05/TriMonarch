import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface UserResource {
  id: string;
  organization_id: string;
  email?: string;
  status?: string;
  role?: string;
}

export class UserPolicy implements AuthorizationPolicy<UserResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: UserResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant user access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE' || action === 'DELETE') {
      if (isAdmin || isSuperAdmin) return { allowed: true };
      return { allowed: false, reason: 'Only administrators can create or delete users' };
    }

    if (action === 'ASSIGN') {
      if (!isAdmin && !isSuperAdmin) {
        return { allowed: false, reason: 'Role assignment requires administrator privileges' };
      }
      if (resource?.role === 'SUPER_ADMIN' && !isSuperAdmin) {
        return { allowed: false, reason: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' };
      }
      return { allowed: true };
    }

    if (action === 'UPDATE') {
      if (resource && resource.id === context.userId) {
        if (context.requestedFields) {
          const forbiddenFields = ['role', 'organization_id', 'status', 'password_hash'];
          const hasForbidden = context.requestedFields.some((f) => forbiddenFields.includes(f));
          if (hasForbidden && !isAdmin && !isSuperAdmin) {
            return { allowed: false, reason: 'Users cannot update their own role, status, or organization' };
          }
        }
        return { allowed: true };
      }
      if (isAdmin || isSuperAdmin) return { allowed: true };
      return { allowed: false, reason: 'User update permission denied' };
    }

    return { allowed: false, reason: 'Action not permitted by UserPolicy' };
  }
}

export const userPolicy = new UserPolicy();
