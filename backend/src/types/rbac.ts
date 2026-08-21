export type StandardRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'AUDITOR';

export type StandardPermission =
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'role:read'
  | 'role:assign'
  | 'organization:read'
  | 'organization:manage'
  | 'employee:read'
  | 'employee:create'
  | 'employee:update'
  | 'employee:delete'
  | 'department:read'
  | 'department:write'
  | 'partner:read'
  | 'partner:create'
  | 'partner:update'
  | 'partner:delete'
  | 'partner:manage'
  | 'customer:read'
  | 'customer:write'
  | 'supplier:read'
  | 'supplier:write'
  | 'product:read'
  | 'product:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:adjust'
  | 'inventory:delete'
  | 'inventory:manage'
  | 'sales_order:read'
  | 'sales_order:write'
  | 'sales_order:approve'
  | 'sales_order:delete'
  | 'sales_order:manage'
  | 'purchase_order:read'
  | 'purchase_order:write'
  | 'purchase_order:approve'
  | 'purchase_order:delete'
  | 'purchase_order:manage'
  | 'bom:read'
  | 'bom:write'
  | 'bom:delete'
  | 'bom:manage'
  | 'manufacturing_order:read'
  | 'manufacturing_order:write'
  | 'manufacturing_order:delete'
  | 'manufacturing_order:manage'
  | 'manufacturing:read'
  | 'manufacturing:write'
  | 'manufacturing:execute'
  | 'manufacturing:approve'
  | 'manufacturing:delete'
  | 'manufacturing:manage'
  | 'audit:read'
  | 'audit:export'
  | 'audit:manage'
  | 'report:read';

export const ROLE_PERMISSIONS: Record<StandardRole, StandardPermission[]> = {
  SUPER_ADMIN: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:read',
    'role:assign',
    'organization:read',
    'organization:manage',
    'employee:read',
    'employee:create',
    'employee:update',
    'employee:delete',
    'department:read',
    'department:write',
    'partner:read',
    'partner:create',
    'partner:update',
    'partner:delete',
    'partner:manage',
    'customer:read',
    'customer:write',
    'supplier:read',
    'supplier:write',
    'product:read',
    'product:write',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:delete',
    'inventory:manage',
    'sales_order:read',
    'sales_order:write',
    'sales_order:approve',
    'sales_order:delete',
    'sales_order:manage',
    'purchase_order:read',
    'purchase_order:write',
    'purchase_order:approve',
    'purchase_order:delete',
    'purchase_order:manage',
    'bom:read',
    'bom:write',
    'bom:delete',
    'bom:manage',
    'manufacturing_order:read',
    'manufacturing_order:write',
    'manufacturing_order:delete',
    'manufacturing_order:manage',
    'manufacturing:read',
    'manufacturing:write',
    'manufacturing:execute',
    'manufacturing:approve',
    'manufacturing:delete',
    'manufacturing:manage',
    'audit:read',
    'audit:export',
    'audit:manage',
    'report:read',
  ],
  ADMIN: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:read',
    'role:assign',
    'organization:read',
    'organization:manage',
    'employee:read',
    'employee:create',
    'employee:update',
    'employee:delete',
    'department:read',
    'department:write',
    'partner:read',
    'partner:create',
    'partner:update',
    'partner:delete',
    'partner:manage',
    'customer:read',
    'customer:write',
    'supplier:read',
    'supplier:write',
    'product:read',
    'product:write',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:delete',
    'inventory:manage',
    'sales_order:read',
    'sales_order:write',
    'sales_order:approve',
    'sales_order:delete',
    'sales_order:manage',
    'purchase_order:read',
    'purchase_order:write',
    'purchase_order:approve',
    'purchase_order:delete',
    'purchase_order:manage',
    'bom:read',
    'bom:write',
    'bom:delete',
    'bom:manage',
    'manufacturing_order:read',
    'manufacturing_order:write',
    'manufacturing_order:delete',
    'manufacturing_order:manage',
    'manufacturing:read',
    'manufacturing:write',
    'manufacturing:execute',
    'manufacturing:approve',
    'manufacturing:delete',
    'manufacturing:manage',
    'audit:read',
    'audit:export',
    'audit:manage',
    'report:read',
  ],
  MANAGER: [
    'user:read',
    'employee:read',
    'employee:create',
    'employee:update',
    'department:read',
    'partner:read',
    'partner:create',
    'partner:update',
    'partner:delete',
    'partner:manage',
    'customer:read',
    'customer:write',
    'supplier:read',
    'supplier:write',
    'product:read',
    'product:write',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:delete',
    'inventory:manage',
    'sales_order:read',
    'sales_order:write',
    'sales_order:approve',
    'sales_order:delete',
    'sales_order:manage',
    'purchase_order:read',
    'purchase_order:write',
    'purchase_order:approve',
    'purchase_order:delete',
    'purchase_order:manage',
    'bom:read',
    'bom:write',
    'bom:delete',
    'bom:manage',
    'manufacturing_order:read',
    'manufacturing_order:write',
    'manufacturing_order:delete',
    'manufacturing_order:manage',
    'manufacturing:read',
    'manufacturing:write',
    'manufacturing:execute',
    'manufacturing:approve',
    'manufacturing:delete',
    'manufacturing:manage',
    'audit:read',
    'audit:export',
    'audit:manage',
    'report:read',
  ],
  EMPLOYEE: [
    'employee:read',
    'department:read',
    'partner:read',
    'partner:create',
    'partner:update',
    'customer:read',
    'supplier:read',
    'product:read',
    'inventory:read',
    'sales_order:read',
    'purchase_order:read',
    'bom:read',
    'manufacturing_order:read',
  ],
  AUDITOR: [
    'user:read',
    'employee:read',
    'department:read',
    'partner:read',
    'customer:read',
    'supplier:read',
    'product:read',
    'inventory:read',
    'sales_order:read',
    'purchase_order:read',
    'bom:read',
    'manufacturing_order:read',
    'audit:read',
    'report:read',
  ],
};
