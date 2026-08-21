import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface PartnerResource {
  id: string;
  organization_id: string;
  type?: 'customer' | 'supplier' | 'both';
  status?: string;
}

export class PartnerPolicy implements AuthorizationPolicy<PartnerResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: PartnerResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant partner access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE' || action === 'UPDATE') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Partner create or update access denied' };
    }

    if (action === 'DELETE' || action === 'MANAGE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Partner management or deletion requires managerial privileges' };
    }

    return { allowed: false, reason: 'Action not permitted by PartnerPolicy' };
  }
}

export const partnerPolicy = new PartnerPolicy();
