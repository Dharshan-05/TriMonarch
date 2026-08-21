import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface AuditResource {
  id: string;
  organization_id: string;
}

export class AuditPolicy implements AuthorizationPolicy<AuditResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: AuditResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant audit log access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      return { allowed: true };
    }

    if (action === 'EXPORT') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Audit export requires managerial privileges' };
    }

    if (action === 'MANAGE') {
      if (isAdmin || isSuperAdmin) return { allowed: true };
      return { allowed: false, reason: 'Audit management requires administrative privileges' };
    }

    if (action === 'CREATE' || action === 'UPDATE' || action === 'DELETE') {
      return { allowed: false, reason: 'Audit log records are strictly immutable and cannot be mutated or deleted' };
    }

    return { allowed: false, reason: 'Action not permitted by AuditPolicy' };
  }
}

export const auditPolicy = new AuditPolicy();
