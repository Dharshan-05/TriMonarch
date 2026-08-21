import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface ManufacturingOrderResource {
  id: string;
  organization_id: string;
  status: 'draft' | 'planned' | 'confirmed' | 'released' | 'in_progress' | 'completed' | 'cancelled';
}

export class ManufacturingOrderPolicy implements AuthorizationPolicy<ManufacturingOrderResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: ManufacturingOrderResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant manufacturing order access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Manufacturing order creation access denied' };
    }

    if (action === 'UPDATE') {
      if (resource && (resource.status === 'completed' || resource.status === 'cancelled')) {
        if (!isAdmin && !isSuperAdmin) {
          return { allowed: false, reason: `Cannot modify manufacturing order in final state: ${resource.status}` };
        }
      }
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Manufacturing order update access denied' };
    }

    if (action === 'EXECUTE') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Manufacturing order execution access denied' };
    }

    if (action === 'APPROVE' || action === 'MANAGE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Manufacturing order approval/management requires managerial privileges' };
    }

    if (action === 'DELETE' || action === 'REJECT') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Manufacturing order cancellation/deletion requires managerial privileges' };
    }

    return { allowed: false, reason: 'Action not permitted by ManufacturingOrderPolicy' };
  }
}

export const manufacturingOrderPolicy = new ManufacturingOrderPolicy();
