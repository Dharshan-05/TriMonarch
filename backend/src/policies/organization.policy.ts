import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface OrganizationResource {
  id: string;
  name?: string;
  code?: string;
}

export class OrganizationPolicy implements AuthorizationPolicy<OrganizationResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: OrganizationResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');

    if (resource && resource.id !== context.organizationId && !isSuperAdmin) {
      return { allowed: false, reason: 'Cross-tenant organization access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'UPDATE' || action === 'MANAGE') {
      if (isAdmin || isSuperAdmin) return { allowed: true };
      return { allowed: false, reason: 'Organization management requires administrator privileges' };
    }

    if (action === 'DELETE' || action === 'CREATE') {
      if (isSuperAdmin) return { allowed: true };
      return { allowed: false, reason: 'Only SUPER_ADMIN can create or delete organizations' };
    }

    return { allowed: false, reason: 'Action not permitted by OrganizationPolicy' };
  }
}

export const organizationPolicy = new OrganizationPolicy();
