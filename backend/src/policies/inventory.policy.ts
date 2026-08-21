import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface InventoryResource {
  id: string;
  organization_id: string;
  product_id?: string;
  warehouse_id?: string;
  quantity?: string | number;
}

export class InventoryPolicy implements AuthorizationPolicy<InventoryResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: InventoryResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant inventory access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'CREATE' || action === 'UPDATE' || (action as string) === 'ADJUST') {
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE')) return { allowed: true };
      return { allowed: false, reason: 'Inventory create, update, or adjustment access denied' };
    }

    if (action === 'DELETE' || action === 'MANAGE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Inventory management or deletion requires managerial privileges' };
    }

    return { allowed: false, reason: 'Action not permitted by InventoryPolicy' };
  }
}

export const inventoryPolicy = new InventoryPolicy();
