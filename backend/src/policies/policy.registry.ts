import { AuthorizationPolicy } from '../types/policy';
import { userPolicy } from './user.policy';
import { organizationPolicy } from './organization.policy';
import { employeePolicy } from './employee.policy';
import { manufacturingOrderPolicy } from './manufacturingOrder.policy';
import { auditPolicy } from './audit.policy';
import { partnerPolicy } from './partner.policy';
import { productPolicy } from './product.policy';
import { inventoryPolicy } from './inventory.policy';
import { salesOrderPolicy } from './salesOrder.policy';
import { purchaseOrderPolicy } from './purchaseOrder.policy';
import { bomPolicy } from './bom.policy';

export class PolicyRegistry {
  private readonly policies = new Map<string, AuthorizationPolicy<unknown>>();

  constructor() {
    this.register('USER', userPolicy as AuthorizationPolicy<unknown>);
    this.register('ORGANIZATION', organizationPolicy as AuthorizationPolicy<unknown>);
    this.register('EMPLOYEE', employeePolicy as AuthorizationPolicy<unknown>);
    this.register('MANUFACTURING_ORDER', manufacturingOrderPolicy as AuthorizationPolicy<unknown>);
    this.register('MANUFACTURING', manufacturingOrderPolicy as AuthorizationPolicy<unknown>);
    this.register('AUDIT', auditPolicy as AuthorizationPolicy<unknown>);
    this.register('PARTNER', partnerPolicy as AuthorizationPolicy<unknown>);
    this.register('CUSTOMER', partnerPolicy as AuthorizationPolicy<unknown>);
    this.register('SUPPLIER', partnerPolicy as AuthorizationPolicy<unknown>);
    this.register('PRODUCT', productPolicy as AuthorizationPolicy<unknown>);
    this.register('INVENTORY', inventoryPolicy as AuthorizationPolicy<unknown>);
    this.register('SALES_ORDER', salesOrderPolicy as AuthorizationPolicy<unknown>);
    this.register('PURCHASE_ORDER', purchaseOrderPolicy as AuthorizationPolicy<unknown>);
    this.register('BOM', bomPolicy as AuthorizationPolicy<unknown>);
  }

  register(resourceType: string, policy: AuthorizationPolicy<unknown>): void {
    this.policies.set(resourceType.toUpperCase(), policy);
  }

  get(resourceType: string): AuthorizationPolicy<unknown> | undefined {
    return this.policies.get(resourceType.toUpperCase());
  }
}

export const policyRegistry = new PolicyRegistry();
