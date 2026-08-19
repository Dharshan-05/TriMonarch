export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'AUTH_FAILURE'
  | 'ACCESS_DENIED'
  | 'READ'
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
  | 'PURCHASE_ORDER'
  | 'BOM'
  | 'MANUFACTURING_ORDER'
  | 'AUTHENTICATION'
  | 'SESSION';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  request_id: string | null;
  success: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface CreateAuditInput {
  organization_id: string;
  user_id?: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string | null;
  request_id?: string | null;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuditFilterParams {
  action?: AuditAction;
  entity_type?: AuditEntityType;
  entity_id?: string;
  user_id?: string;
  request_id?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
}

