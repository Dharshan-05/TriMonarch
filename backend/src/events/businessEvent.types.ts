import { PoolClient } from 'pg';
import { AuditAction, AuditCategory, AuditEntityType } from '../audit/audit.types';

export type BusinessEventName =
  // Authentication / User
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_CHANGE_FAILED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  // Product
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_STATUS_CHANGED'
  | 'PRODUCT_DELETED'
  // Sales
  | 'SALES_ORDER_CREATED'
  | 'SALES_ORDER_UPDATED'
  | 'SALES_ORDER_CONFIRMED'
  | 'SALES_ORDER_CANCELLED'
  | 'SALES_ORDER_COMPLETED'
  | 'SALES_ORDER_DELETED'
  | 'SALES_DELIVERY_CREATED'
  | 'SALES_DELIVERY_SHIPPED'
  | 'SALES_DELIVERY_CANCELLED'
  // Purchasing
  | 'PURCHASE_ORDER_CREATED'
  | 'PURCHASE_ORDER_UPDATED'
  | 'PURCHASE_ORDER_SUBMITTED'
  | 'PURCHASE_ORDER_APPROVED'
  | 'PURCHASE_ORDER_ORDERED'
  | 'PURCHASE_ORDER_PARTIALLY_RECEIVED'
  | 'PURCHASE_ORDER_RECEIVED'
  | 'PURCHASE_ORDER_COMPLETED'
  | 'PURCHASE_ORDER_CANCELLED'
  | 'PURCHASE_ORDER_DELETED'
  | 'PURCHASE_RECEIPT_CREATED'
  | 'PURCHASE_RECEIPT_POSTED'
  | 'PURCHASE_RECEIPT_CANCELLED'
  // Accounts Payable
  | 'SUPPLIER_INVOICE_CREATED'
  | 'SUPPLIER_INVOICE_UPDATED'
  | 'SUPPLIER_INVOICE_POSTED'
  | 'SUPPLIER_INVOICE_CANCELLED'
  | 'SUPPLIER_PAYMENT_RECORDED'
  // Inventory
  | 'INVENTORY_CREATED'
  | 'INVENTORY_UPDATED'
  | 'INVENTORY_ADJUSTED'
  | 'INVENTORY_DELETED'
  | 'INVENTORY_RESERVED'
  | 'INVENTORY_RESERVATION_RELEASED'
  | 'INVENTORY_RESERVATION_CONSUMED'
  | 'INVENTORY_STOCK_INCREASED'
  | 'INVENTORY_STOCK_DECREASED'
  // BOM
  | 'BOM_CREATED'
  | 'BOM_UPDATED'
  | 'BOM_COMPONENT_ADDED'
  | 'BOM_COMPONENT_UPDATED'
  | 'BOM_COMPONENT_REMOVED'
  | 'BOM_ACTIVATED'
  | 'BOM_DEACTIVATED'
  | 'BOM_ARCHIVED'
  | 'BOM_DELETED'
  | 'BOM_REVISION_CREATED'
  | 'BOM_VERSION_CREATED'
  | 'BOM_DEFAULT_SET'
  // Manufacturing
  | 'MANUFACTURING_ORDER_CREATED'
  | 'MANUFACTURING_ORDER_UPDATED'
  | 'MANUFACTURING_ORDER_CONFIRMED'
  | 'MANUFACTURING_ORDER_PLANNED'
  | 'MANUFACTURING_ORDER_RELEASED'
  | 'MANUFACTURING_ORDER_STARTED'
  | 'MANUFACTURING_STARTED'
  | 'MANUFACTURING_ORDER_CANCELLED'
  | 'MANUFACTURING_CANCELLED'
  | 'MANUFACTURING_ORDER_COMPLETED'
  | 'MANUFACTURING_COMPLETED'
  | 'MANUFACTURING_ORDER_DELETED'
  // Manufacturing Material Execution
  | 'MANUFACTURING_MATERIAL_CONSUMED'
  | 'MANUFACTURING_CONSUMPTION_REVERSED'
  // Manufacturing Production
  | 'MANUFACTURING_PRODUCTION_RECORDED'
  | 'MANUFACTURING_PRODUCTION_REPORTED'
  | 'MANUFACTURING_PRODUCTION_REVERSED'
  // Audit
  | 'AUDIT_EXPORTED';

export interface BusinessEventDefinition {
  eventName: BusinessEventName;
  action: AuditAction;
  entityType: AuditEntityType;
  category: AuditCategory;
}

export interface BusinessEventInput {
  eventName: BusinessEventName;
  organization_id: string;
  user_id?: string | null;
  actor_id?: string | null;
  entity_type?: AuditEntityType;
  entity_id?: string | null;
  request_id?: string | null;
  correlation_id?: string | null;
  reason?: string | null;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  client?: PoolClient;
}
