import { AuthorizationPolicy, PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';

export interface EmployeeResource {
  id: string;
  organization_id: string;
  user_id?: string;
  department_id?: string;
}

export class EmployeePolicy implements AuthorizationPolicy<EmployeeResource> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: EmployeeResource,
  ): AuthorizationDecision {
    const roles = context.roles.map((r) => r.toUpperCase());
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isAdmin = roles.includes('ADMIN');
    const isManager = roles.includes('MANAGER');

    if (resource && resource.organization_id && resource.organization_id !== context.organizationId) {
      return { allowed: false, reason: 'Cross-tenant employee access denied' };
    }

    if (action === 'READ' || action === 'LIST') {
      if (resource && resource.user_id === context.userId) return { allowed: true };
      if (isAdmin || isSuperAdmin || isManager || roles.includes('EMPLOYEE') || roles.includes('AUDITOR')) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Employee read access denied' };
    }

    if (action === 'CREATE' || action === 'DELETE') {
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Employee creation or deletion requires managerial privileges' };
    }

    if (action === 'UPDATE') {
      if (resource && resource.user_id === context.userId) {
        if (context.requestedFields) {
          const sensitiveFields = ['salary', 'department_id', 'job_title', 'employment_status'];
          const modifyingSensitive = context.requestedFields.some((f) => sensitiveFields.includes(f));
          if (modifyingSensitive && !isAdmin && !isSuperAdmin && !isManager) {
            return { allowed: false, reason: 'Employees cannot update sensitive employment fields' };
          }
        }
        return { allowed: true };
      }
      if (isAdmin || isSuperAdmin || isManager) return { allowed: true };
      return { allowed: false, reason: 'Employee update access denied' };
    }

    return { allowed: false, reason: 'Action not permitted by EmployeePolicy' };
  }
}

export const employeePolicy = new EmployeePolicy();
