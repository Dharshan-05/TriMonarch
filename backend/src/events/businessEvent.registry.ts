import { BusinessEventName, BusinessEventDefinition } from './businessEvent.types';

export const BUSINESS_EVENT_REGISTRY: Record<BusinessEventName, BusinessEventDefinition> = {
  // Auth / User
  LOGIN_SUCCESS: { eventName: 'LOGIN_SUCCESS', action: 'LOGIN', entityType: 'AUTHENTICATION', category: 'CATEGORY_A' },
  LOGIN_FAILED: { eventName: 'LOGIN_FAILED', action: 'AUTH_FAILURE', entityType: 'AUTHENTICATION', category: 'CATEGORY_A' },
  LOGOUT: { eventName: 'LOGOUT', action: 'LOGOUT', entityType: 'AUTHENTICATION', category: 'CATEGORY_A' },
  USER_CREATED: { eventName: 'USER_CREATED', action: 'CREATE', entityType: 'USER', category: 'CATEGORY_A' },
  USER_UPDATED: { eventName: 'USER_UPDATED', action: 'UPDATE', entityType: 'USER', category: 'CATEGORY_B' },
  USER_STATUS_CHANGED: { eventName: 'USER_STATUS_CHANGED', action: 'UPDATE', entityType: 'USER', category: 'CATEGORY_A' },
  USER_DELETED: { eventName: 'USER_DELETED', action: 'DELETE', entityType: 'USER', category: 'CATEGORY_A' },
  PASSWORD_CHANGED: { eventName: 'PASSWORD_CHANGED', action: 'UPDATE', entityType: 'USER', category: 'CATEGORY_A' },
  PASSWORD_CHANGE_FAILED: { eventName: 'PASSWORD_CHANGE_FAILED', action: 'AUTH_FAILURE', entityType: 'USER', category: 'CATEGORY_A' },
  PASSWORD_RESET_REQUESTED: { eventName: 'PASSWORD_RESET_REQUESTED', action: 'UPDATE', entityType: 'USER', category: 'CATEGORY_A' },
  PASSWORD_RESET_COMPLETED: { eventName: 'PASSWORD_RESET_COMPLETED', action: 'UPDATE', entityType: 'USER', category: 'CATEGORY_A' },

  // Product
  PRODUCT_CREATED: { eventName: 'PRODUCT_CREATED', action: 'CREATE', entityType: 'PRODUCT', category: 'CATEGORY_A' },
  PRODUCT_UPDATED: { eventName: 'PRODUCT_UPDATED', action: 'UPDATE', entityType: 'PRODUCT', category: 'CATEGORY_B' },
  PRODUCT_STATUS_CHANGED: { eventName: 'PRODUCT_STATUS_CHANGED', action: 'UPDATE', entityType: 'PRODUCT', category: 'CATEGORY_A' },
  PRODUCT_DELETED: { eventName: 'PRODUCT_DELETED', action: 'DELETE', entityType: 'PRODUCT', category: 'CATEGORY_A' },

  // Sales
  SALES_ORDER_CREATED: { eventName: 'SALES_ORDER_CREATED', action: 'CREATE', entityType: 'SALES_ORDER', category: 'CATEGORY_A' },
  SALES_ORDER_UPDATED: { eventName: 'SALES_ORDER_UPDATED', action: 'UPDATE', entityType: 'SALES_ORDER', category: 'CATEGORY_B' },
  SALES_ORDER_CONFIRMED: { eventName: 'SALES_ORDER_CONFIRMED', action: 'UPDATE', entityType: 'SALES_ORDER', category: 'CATEGORY_A' },
  SALES_ORDER_CANCELLED: { eventName: 'SALES_ORDER_CANCELLED', action: 'UPDATE', entityType: 'SALES_ORDER', category: 'CATEGORY_A' },
  SALES_ORDER_COMPLETED: { eventName: 'SALES_ORDER_COMPLETED', action: 'UPDATE', entityType: 'SALES_ORDER', category: 'CATEGORY_A' },
  SALES_ORDER_DELETED: { eventName: 'SALES_ORDER_DELETED', action: 'DELETE', entityType: 'SALES_ORDER', category: 'CATEGORY_A' },
  SALES_DELIVERY_CREATED: { eventName: 'SALES_DELIVERY_CREATED', action: 'CREATE', entityType: 'SALES_DELIVERY', category: 'CATEGORY_A' },
  SALES_DELIVERY_SHIPPED: { eventName: 'SALES_DELIVERY_SHIPPED', action: 'UPDATE', entityType: 'SALES_DELIVERY', category: 'CATEGORY_A' },
  SALES_DELIVERY_CANCELLED: { eventName: 'SALES_DELIVERY_CANCELLED', action: 'UPDATE', entityType: 'SALES_DELIVERY', category: 'CATEGORY_A' },

  // Purchasing
  PURCHASE_ORDER_CREATED: { eventName: 'PURCHASE_ORDER_CREATED', action: 'CREATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_UPDATED: { eventName: 'PURCHASE_ORDER_UPDATED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_B' },
  PURCHASE_ORDER_SUBMITTED: { eventName: 'PURCHASE_ORDER_SUBMITTED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_APPROVED: { eventName: 'PURCHASE_ORDER_APPROVED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_ORDERED: { eventName: 'PURCHASE_ORDER_ORDERED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_PARTIALLY_RECEIVED: { eventName: 'PURCHASE_ORDER_PARTIALLY_RECEIVED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_RECEIVED: { eventName: 'PURCHASE_ORDER_RECEIVED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_COMPLETED: { eventName: 'PURCHASE_ORDER_COMPLETED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_CANCELLED: { eventName: 'PURCHASE_ORDER_CANCELLED', action: 'UPDATE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_ORDER_DELETED: { eventName: 'PURCHASE_ORDER_DELETED', action: 'DELETE', entityType: 'PURCHASE_ORDER', category: 'CATEGORY_A' },
  PURCHASE_RECEIPT_CREATED: { eventName: 'PURCHASE_RECEIPT_CREATED', action: 'CREATE', entityType: 'PURCHASE_RECEIPT', category: 'CATEGORY_A' },
  PURCHASE_RECEIPT_POSTED: { eventName: 'PURCHASE_RECEIPT_POSTED', action: 'UPDATE', entityType: 'PURCHASE_RECEIPT', category: 'CATEGORY_A' },
  PURCHASE_RECEIPT_CANCELLED: { eventName: 'PURCHASE_RECEIPT_CANCELLED', action: 'UPDATE', entityType: 'PURCHASE_RECEIPT', category: 'CATEGORY_A' },

  // Accounts Payable
  SUPPLIER_INVOICE_CREATED: { eventName: 'SUPPLIER_INVOICE_CREATED', action: 'CREATE', entityType: 'SUPPLIER_INVOICE', category: 'CATEGORY_A' },
  SUPPLIER_INVOICE_UPDATED: { eventName: 'SUPPLIER_INVOICE_UPDATED', action: 'UPDATE', entityType: 'SUPPLIER_INVOICE', category: 'CATEGORY_B' },
  SUPPLIER_INVOICE_POSTED: { eventName: 'SUPPLIER_INVOICE_POSTED', action: 'UPDATE', entityType: 'SUPPLIER_INVOICE', category: 'CATEGORY_A' },
  SUPPLIER_INVOICE_CANCELLED: { eventName: 'SUPPLIER_INVOICE_CANCELLED', action: 'UPDATE', entityType: 'SUPPLIER_INVOICE', category: 'CATEGORY_A' },
  SUPPLIER_PAYMENT_RECORDED: { eventName: 'SUPPLIER_PAYMENT_RECORDED', action: 'CREATE', entityType: 'SUPPLIER_PAYMENT', category: 'CATEGORY_A' },

  // Inventory
  INVENTORY_CREATED: { eventName: 'INVENTORY_CREATED', action: 'CREATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_UPDATED: { eventName: 'INVENTORY_UPDATED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_B' },
  INVENTORY_ADJUSTED: { eventName: 'INVENTORY_ADJUSTED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_DELETED: { eventName: 'INVENTORY_DELETED', action: 'DELETE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_RESERVED: { eventName: 'INVENTORY_RESERVED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_RESERVATION_RELEASED: { eventName: 'INVENTORY_RESERVATION_RELEASED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_RESERVATION_CONSUMED: { eventName: 'INVENTORY_RESERVATION_CONSUMED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_STOCK_INCREASED: { eventName: 'INVENTORY_STOCK_INCREASED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },
  INVENTORY_STOCK_DECREASED: { eventName: 'INVENTORY_STOCK_DECREASED', action: 'UPDATE', entityType: 'INVENTORY', category: 'CATEGORY_A' },

  // BOM
  BOM_CREATED: { eventName: 'BOM_CREATED', action: 'CREATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_UPDATED: { eventName: 'BOM_UPDATED', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_B' },
  BOM_COMPONENT_ADDED: { eventName: 'BOM_COMPONENT_ADDED', action: 'CREATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_COMPONENT_UPDATED: { eventName: 'BOM_COMPONENT_UPDATED', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_B' },
  BOM_COMPONENT_REMOVED: { eventName: 'BOM_COMPONENT_REMOVED', action: 'DELETE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_ACTIVATED: { eventName: 'BOM_ACTIVATED', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_DEACTIVATED: { eventName: 'BOM_DEACTIVATED', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_ARCHIVED: { eventName: 'BOM_ARCHIVED', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_DELETED: { eventName: 'BOM_DELETED', action: 'DELETE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_REVISION_CREATED: { eventName: 'BOM_REVISION_CREATED', action: 'CREATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_VERSION_CREATED: { eventName: 'BOM_VERSION_CREATED', action: 'CREATE', entityType: 'BOM', category: 'CATEGORY_A' },
  BOM_DEFAULT_SET: { eventName: 'BOM_DEFAULT_SET', action: 'UPDATE', entityType: 'BOM', category: 'CATEGORY_A' },

  // Manufacturing
  MANUFACTURING_ORDER_CREATED: { eventName: 'MANUFACTURING_ORDER_CREATED', action: 'CREATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_UPDATED: { eventName: 'MANUFACTURING_ORDER_UPDATED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_B' },
  MANUFACTURING_ORDER_CONFIRMED: { eventName: 'MANUFACTURING_ORDER_CONFIRMED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_PLANNED: { eventName: 'MANUFACTURING_ORDER_PLANNED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_RELEASED: { eventName: 'MANUFACTURING_ORDER_RELEASED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_STARTED: { eventName: 'MANUFACTURING_ORDER_STARTED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_STARTED: { eventName: 'MANUFACTURING_STARTED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_CANCELLED: { eventName: 'MANUFACTURING_ORDER_CANCELLED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_CANCELLED: { eventName: 'MANUFACTURING_CANCELLED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_COMPLETED: { eventName: 'MANUFACTURING_ORDER_COMPLETED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_COMPLETED: { eventName: 'MANUFACTURING_COMPLETED', action: 'UPDATE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },
  MANUFACTURING_ORDER_DELETED: { eventName: 'MANUFACTURING_ORDER_DELETED', action: 'DELETE', entityType: 'MANUFACTURING_ORDER', category: 'CATEGORY_A' },

  // Material Execution
  MANUFACTURING_MATERIAL_CONSUMED: { eventName: 'MANUFACTURING_MATERIAL_CONSUMED', action: 'UPDATE', entityType: 'MANUFACTURING_MATERIAL_CONSUMPTION', category: 'CATEGORY_A' },
  MANUFACTURING_CONSUMPTION_REVERSED: { eventName: 'MANUFACTURING_CONSUMPTION_REVERSED', action: 'UPDATE', entityType: 'MANUFACTURING_REVERSAL', category: 'CATEGORY_A' },

  // Production
  MANUFACTURING_PRODUCTION_RECORDED: { eventName: 'MANUFACTURING_PRODUCTION_RECORDED', action: 'UPDATE', entityType: 'MANUFACTURING_PRODUCTION', category: 'CATEGORY_A' },
  MANUFACTURING_PRODUCTION_REPORTED: { eventName: 'MANUFACTURING_PRODUCTION_REPORTED', action: 'UPDATE', entityType: 'MANUFACTURING_PRODUCTION', category: 'CATEGORY_A' },
  MANUFACTURING_PRODUCTION_REVERSED: { eventName: 'MANUFACTURING_PRODUCTION_REVERSED', action: 'UPDATE', entityType: 'MANUFACTURING_REVERSAL', category: 'CATEGORY_A' },

  // Audit
  AUDIT_EXPORTED: { eventName: 'AUDIT_EXPORTED', action: 'EXPORT', entityType: 'AUDIT_LOG', category: 'CATEGORY_A' },
};

export const getBusinessEventDefinition = (eventName: BusinessEventName): BusinessEventDefinition => {
  const def = BUSINESS_EVENT_REGISTRY[eventName];
  if (!def) {
    throw new Error(`Unknown business event name '${eventName}'`);
  }
  return def;
};
