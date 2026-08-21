export type AuditCategory = 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'AUTH_FAILURE'
  | 'ACCESS_DENIED'
  | 'READ'
  | 'EXPORT'
  | 'ROLE_ASSIGN'
  | 'ROLE_REMOVE';

export type AuditEntityType =
  | 'ORGANIZATION'
  | 'USER'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'EMPLOYEE'
  | 'PRODUCT'
  | 'WAREHOUSE'
  | 'INVENTORY'
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'SALES_ORDER'
  | 'SALES_DELIVERY'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_RECEIPT'
  | 'SUPPLIER_INVOICE'
  | 'SUPPLIER_PAYMENT'
  | 'BOM'
  | 'MANUFACTURING_ORDER'
  | 'MANUFACTURING_MATERIAL_CONSUMPTION'
  | 'MANUFACTURING_PRODUCTION'
  | 'MANUFACTURING_REVERSAL'
  | 'AUTHENTICATION'
  | 'SESSION'
  | 'AUDIT_LOG';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  category: AuditCategory;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  request_id: string | null;
  correlation_id: string | null;
  reason: string | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  success: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface CreateAuditInput {
  organization_id: string;
  user_id?: string | null;
  actor_id?: string | null;
  category?: AuditCategory;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string | null;
  request_id?: string | null;
  correlation_id?: string | null;
  reason?: string | null;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuditFilterParams {
  category?: AuditCategory | string;
  action?: AuditAction | string;
  entity_type?: AuditEntityType | string;
  resource?: string;
  entity_id?: string;
  resourceId?: string;
  user_id?: string;
  actor_id?: string;
  actorUserId?: string;
  request_id?: string;
  correlation_id?: string;
  eventType?: string;
  severity?: string;
  ipAddress?: string;
  search?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
}
