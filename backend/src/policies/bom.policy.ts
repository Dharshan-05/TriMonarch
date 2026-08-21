import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface BomResource {
  id: string;
  organization_id: string;
  product_id?: string;
  status?: string;
}

export class BomPolicy implements AuthorizationPolicy<BomResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: BomResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant BOM access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE' || action === 'UPDATE') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'BOM create or update access denied' };
    }

    if (action === 'DELETE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'BOM deletion requires managerial privileges' };
    }

    if (action === 'MANAGE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'BOM management requires managerial privileges' };
    }

    return { allowed: false, reason: 'Action not permitted by BomPolicy' };
  }
}

export const bomPolicy = new BomPolicy();
