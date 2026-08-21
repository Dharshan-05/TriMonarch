import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface PurchaseOrderResource {
  id: string;
  organization_id: string;
  supplier_id?: string;
  status?: string;
  total_amount?: string | number;
}

export class PurchaseOrderPolicy implements AuthorizationPolicy<PurchaseOrderResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: PurchaseOrderResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant purchase order access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE' || action === 'UPDATE') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Purchase order create or update access denied' };
    }

    if ((action as string) === 'APPROVE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Purchase order approval requires managerial privileges' };
    }

    if (action === 'DELETE' || action === 'MANAGE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Purchase order management or deletion requires managerial privileges' };
    }

    return { allowed: false, reason: 'Action not permitted by PurchaseOrderPolicy' };
  }
}

export const purchaseOrderPolicy = new PurchaseOrderPolicy();
