export type AuthorizationAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LIST'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'EXPORT'
  | 'EXECUTE'
  | 'MANAGE';

export interface PolicyContext {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions?: string[];
  requestedFields?: string[];
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason?: string;
}

export interface AuthorizationPolicy<TResource = unknown> {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resource?: TResource,
  ): AuthorizationDecision;
}
