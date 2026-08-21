import { policyRegistry } from '../policies/policy.registry';
import { PolicyContext, AuthorizationAction, AuthorizationDecision } from '../types/policy';
import { InsufficientPermissionsError } from '../errors/authentication.errors';

export class PolicyEngineService {
  evaluate(
    context: PolicyContext,
    action: AuthorizationAction,
    resourceType: string,
    resource?: unknown,
  ): AuthorizationDecision {
    if (!context || !context.userId || !context.organizationId || !context.roles) {
      return { allowed: false, reason: 'Invalid or missing policy context' };
    }

    const policy = policyRegistry.get(resourceType);
    if (!policy) {
      // Deny-by-default for unmapped resource types
      return { allowed: false, reason: `No authorization policy registered for resource type '${resourceType}'` };
    }

    try {
      return policy.evaluate(context, action, resource);
    } catch (error) {
      return {
        allowed: false,
        reason: `Policy evaluation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  can(
    context: PolicyContext,
    action: AuthorizationAction,
    resourceType: string,
    resource?: unknown,
  ): boolean {
    return this.evaluate(context, action, resourceType, resource).allowed;
  }

  assertCan(
    context: PolicyContext,
    action: AuthorizationAction,
    resourceType: string,
    resource?: unknown,
  ): void {
    const decision = this.evaluate(context, action, resourceType, resource);
    if (!decision.allowed) {
      throw new InsufficientPermissionsError(decision.reason || 'Access denied by policy engine');
    }
  }
}

export const policyEngine = new PolicyEngineService();
