export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = 'Validation failed', details: unknown = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message = 'HTTP method is not allowed') {
    super(message, 405, 'METHOD_NOT_ALLOWED');
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported Media Type') {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request payload size exceeds configured limit') {
    super(message, 413, 'PAYLOAD_TOO_LARGE');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

export class CorsDeniedError extends AppError {
  constructor(message = 'CORS origin not allowed') {
    super(message, 403, 'CORS_ORIGIN_DENIED');
  }
}

export class ParameterPollutionError extends AppError {
  constructor(message = 'HTTP parameter pollution detected') {
    super(message, 400, 'HTTP_PARAMETER_POLLUTION');
  }
}

export class SecurityPolicyViolationError extends AppError {
  constructor(message = 'Security policy violation') {
    super(message, 403, 'SECURITY_POLICY_VIOLATION');
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock available for this operation') {
    super(message, 400, 'INSUFFICIENT_STOCK');
  }
}

export class InsufficientAvailableStockError extends AppError {
  constructor(message = 'Insufficient available stock for reservation') {
    super(message, 400, 'INSUFFICIENT_AVAILABLE_STOCK');
  }
}

export class NegativeStockError extends AppError {
  constructor(message = 'Stock operation would result in negative inventory') {
    super(message, 400, 'NEGATIVE_STOCK');
  }
}

export class InventoryNotFoundError extends NotFoundError {
  constructor(message = 'Inventory record not found') {
    super(message);
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(message = 'Product not found') {
    super(message);
  }
}

export class WarehouseNotFoundError extends NotFoundError {
  constructor(message = 'Warehouse not found') {
    super(message);
  }
}

export class CustomerNotFoundError extends NotFoundError {
  constructor(message = 'Customer not found') {
    super(message);
  }
}

export class SalesOrderNotFoundError extends NotFoundError {
  constructor(message = 'Sales order not found') {
    super(message);
  }
}

export class SalesOrderItemNotFoundError extends NotFoundError {
  constructor(message = 'Sales order item not found') {
    super(message);
  }
}

export class DuplicateOrderNumberError extends AppError {
  constructor(message = 'Sales order number already exists in organization') {
    super(message, 409, 'DUPLICATE_KEY_VIOLATION');
  }
}

export class ReservationNotFoundError extends NotFoundError {
  constructor(message = 'Stock reservation not found') {
    super(message);
  }
}

export class InvalidInventoryQuantityError extends ValidationError {
  constructor(message = 'Invalid inventory quantity value') {
    super(message);
  }
}

export class InvalidReservationQuantityError extends ValidationError {
  constructor(message = 'Invalid reservation quantity value') {
    super(message);
  }
}

export class InvalidReservationStateTransitionError extends AppError {
  constructor(message = 'Invalid reservation state transition') {
    super(message, 400, 'INVALID_RESERVATION_STATE_TRANSITION');
  }
}

export class InvalidSalesOrderStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(
    currentStatus: string,
    targetStatus: string,
    message?: string,
  ) {
    const msg =
      message || `Cannot transition sales order from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_SALES_ORDER_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class SalesOrderAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Sales order is already in state '${status}'`;
    super(msg, 400, 'SALES_ORDER_ALREADY_IN_STATE');
  }
}

export class SalesOrderCannotBeConfirmedError extends AppError {
  constructor(reason: string) {
    super(`Sales order cannot be confirmed: ${reason}`, 400, 'SALES_ORDER_CANNOT_BE_CONFIRMED');
  }
}

export class SalesOrderMissingItemsError extends AppError {
  constructor(message = 'Sales order must contain at least one line item before confirmation') {
    super(message, 400, 'SALES_ORDER_MISSING_ITEMS');
  }
}

// Sales Delivery Errors
export class SalesDeliveryNotFoundError extends AppError {
  constructor(message = 'Sales delivery not found') {
    super(message, 404, 'SALES_DELIVERY_NOT_FOUND');
  }
}

export class SalesDeliveryItemNotFoundError extends AppError {
  constructor(message = 'Sales delivery item not found') {
    super(message, 404, 'SALES_DELIVERY_ITEM_NOT_FOUND');
  }
}

export class InvalidSalesDeliveryStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition sales delivery from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_SALES_DELIVERY_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class SalesDeliveryAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Sales delivery is already in state '${status}'`;
    super(msg, 400, 'SALES_DELIVERY_ALREADY_IN_STATE');
  }
}

export class OverDeliveryError extends AppError {
  constructor(
    salesOrderItemId: string,
    requestedQty: string,
    remainingQty: string,
    message?: string,
  ) {
    const msg =
      message ||
      `Delivery quantity '${requestedQty}' exceeds remaining deliverable quantity '${remainingQty}' for sales order item '${salesOrderItemId}'`;
    super(msg, 400, 'OVER_DELIVERY_EXCEEDED');
  }
}

export class DuplicateDeliveryNumberError extends AppError {
  constructor(message = 'Delivery number already exists in organization') {
    super(message, 409, 'DUPLICATE_DELIVERY_NUMBER');
  }
}

// Purchase Order Errors
export class SupplierNotFoundError extends AppError {
  constructor(message = 'Supplier not found') {
    super(message, 404, 'SUPPLIER_NOT_FOUND');
  }
}

export class PurchaseOrderNotFoundError extends AppError {
  constructor(message = 'Purchase order not found') {
    super(message, 404, 'PURCHASE_ORDER_NOT_FOUND');
  }
}

export class PurchaseOrderItemNotFoundError extends AppError {
  constructor(message = 'Purchase order item not found') {
    super(message, 404, 'PURCHASE_ORDER_ITEM_NOT_FOUND');
  }
}

export class InvalidPurchaseOrderStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition purchase order from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_PURCHASE_ORDER_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class PurchaseOrderAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Purchase order is already in state '${status}'`;
    super(msg, 400, 'PURCHASE_ORDER_ALREADY_IN_STATE');
  }
}

export class DuplicatePurchaseOrderNumberError extends AppError {
  constructor(message = 'Purchase order number already exists in organization') {
    super(message, 409, 'DUPLICATE_PURCHASE_ORDER_NUMBER');
  }
}

export class PurchaseOrderMissingItemsError extends AppError {
  constructor(message = 'Purchase order must contain at least one item before submission') {
    super(message, 400, 'PURCHASE_ORDER_MISSING_ITEMS');
  }
}

export class InvalidPurchaseOrderQuantityError extends AppError {
  constructor(message = 'Purchase order quantity must be greater than zero') {
    super(message, 400, 'INVALID_PURCHASE_ORDER_QUANTITY');
  }
}

export class InvalidPurchaseOrderCostError extends AppError {
  constructor(message = 'Purchase order unit cost cannot be negative') {
    super(message, 400, 'INVALID_PURCHASE_ORDER_COST');
  }
}

// Purchase Receipt Errors
export class PurchaseReceiptNotFoundError extends AppError {
  constructor(message = 'Purchase receipt not found') {
    super(message, 404, 'PURCHASE_RECEIPT_NOT_FOUND');
  }
}

export class PurchaseReceiptItemNotFoundError extends AppError {
  constructor(message = 'Purchase receipt item not found') {
    super(message, 404, 'PURCHASE_RECEIPT_ITEM_NOT_FOUND');
  }
}

export class PurchaseReceiptAlreadyPostedError extends AppError {
  constructor(message = 'Purchase receipt is already posted and cannot be modified or re-posted') {
    super(message, 400, 'PURCHASE_RECEIPT_ALREADY_POSTED');
  }
}

export class PurchaseReceiptAlreadyCompletedError extends AppError {
  constructor(message = 'Purchase receipt is already completed') {
    super(message, 400, 'PURCHASE_RECEIPT_ALREADY_COMPLETED');
  }
}

export class InvalidPurchaseReceiptStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition purchase receipt from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_PURCHASE_RECEIPT_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class PurchaseReceiptAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Purchase receipt is already in state '${status}'`;
    super(msg, 400, 'PURCHASE_RECEIPT_ALREADY_IN_STATE');
  }
}

export class OverReceivingError extends AppError {
  constructor(message = 'Receiving quantity exceeds remaining receivable quantity on Purchase Order item') {
    super(message, 400, 'OVER_RECEIVING_EXCEEDED');
  }
}

export class PurchaseReceiptEmptyError extends AppError {
  constructor(message = 'Purchase receipt must contain at least one item before posting') {
    super(message, 400, 'PURCHASE_RECEIPT_EMPTY');
  }
}

export class PurchaseOrderNotReceivableError extends AppError {
  constructor(message = 'Purchase order is not in a receivable status') {
    super(message, 400, 'PURCHASE_ORDER_NOT_RECEIVABLE');
  }
}

export class DuplicatePurchaseReceiptNumberError extends AppError {
  constructor(message = 'Receipt number already exists in organization') {
    super(message, 409, 'DUPLICATE_PURCHASE_RECEIPT_NUMBER');
  }
}

export class InvalidPurchaseReceiptProductError extends AppError {
  constructor(message = 'Product does not match Purchase Order item product') {
    super(message, 400, 'INVALID_PURCHASE_RECEIPT_PRODUCT');
  }
}

// Supplier Invoice & Accounts Payable Errors
export class SupplierInvoiceNotFoundError extends AppError {
  constructor(message = 'Supplier invoice not found') {
    super(message, 404, 'SUPPLIER_INVOICE_NOT_FOUND');
  }
}

export class SupplierInvoiceItemNotFoundError extends AppError {
  constructor(message = 'Supplier invoice item not found') {
    super(message, 404, 'SUPPLIER_INVOICE_ITEM_NOT_FOUND');
  }
}

export class SupplierPaymentNotFoundError extends AppError {
  constructor(message = 'Supplier payment not found') {
    super(message, 404, 'SUPPLIER_PAYMENT_NOT_FOUND');
  }
}

export class InvalidSupplierInvoiceStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition supplier invoice from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_SUPPLIER_INVOICE_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class SupplierInvoiceAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Supplier invoice is already in state '${status}'`;
    super(msg, 400, 'SUPPLIER_INVOICE_ALREADY_IN_STATE');
  }
}

export class DuplicateSupplierInvoiceError extends AppError {
  constructor(message = 'Supplier invoice number already exists for this supplier in organization') {
    super(message, 409, 'DUPLICATE_SUPPLIER_INVOICE');
  }
}

export class DuplicatePaymentNumberError extends AppError {
  constructor(message = 'Payment number already exists in organization') {
    super(message, 409, 'DUPLICATE_PAYMENT_NUMBER');
  }
}

export class OverPaymentError extends AppError {
  constructor(message = 'Payment amount exceeds current invoice balance due') {
    super(message, 400, 'OVER_PAYMENT_EXCEEDED');
  }
}

export class InvalidInvoiceError extends AppError {
  constructor(message = 'Invalid invoice data or configuration') {
    super(message, 400, 'INVALID_INVOICE');
  }
}

export class SupplierInvoiceMissingItemsError extends AppError {
  constructor(message = 'Supplier invoice must contain at least one item before posting') {
    super(message, 400, 'SUPPLIER_INVOICE_MISSING_ITEMS');
  }
}

export class SupplierInvoiceSupplierMismatchError extends AppError {
  constructor(message = 'Supplier mismatch between invoice, purchase order, or receipt') {
    super(message, 400, 'SUPPLIER_INVOICE_SUPPLIER_MISMATCH');
  }
}

export class SupplierInvoicePurchaseOrderMismatchError extends AppError {
  constructor(message = 'Purchase order item mismatch or invalid purchase order link') {
    super(message, 400, 'SUPPLIER_INVOICE_PO_MISMATCH');
  }
}

export class SupplierInvoicePurchaseReceiptMismatchError extends AppError {
  constructor(message = 'Purchase receipt item mismatch or invalid purchase receipt link') {
    super(message, 400, 'SUPPLIER_INVOICE_RECEIPT_MISMATCH');
  }
}

export class ThreeWayMatchError extends AppError {
  constructor(message = 'Three-way matching validation failed') {
    super(message, 400, 'THREE_WAY_MATCH_FAILED');
  }
}

export class InvoiceAlreadyPaidError extends AppError {
  constructor(message = 'Invoice is already fully paid') {
    super(message, 400, 'INVOICE_ALREADY_PAID');
  }
}

export class InvoiceCancelledError extends AppError {
  constructor(message = 'Invoice is cancelled and cannot receive payments or posting') {
    super(message, 400, 'INVOICE_CANCELLED');
  }
}

export class InvalidPaymentAmountError extends AppError {
  constructor(message = 'Payment amount must be greater than zero') {
    super(message, 400, 'INVALID_PAYMENT_AMOUNT');
  }
}

export class ReservationExpiredError extends AppError {
  constructor(message = 'Stock reservation has expired') {
    super(message, 400, 'RESERVATION_EXPIRED');
  }
}

export class ReservationAlreadyConsumedError extends AppError {
  constructor(message = 'Stock reservation has already been consumed') {
    super(message, 400, 'RESERVATION_ALREADY_CONSUMED');
  }
}

export class ReservationAlreadyReleasedError extends AppError {
  constructor(message = 'Stock reservation has already been released') {
    super(message, 400, 'RESERVATION_ALREADY_RELEASED');
  }
}

export class ZeroStockAdjustmentError extends ValidationError {
  constructor(message = 'Stock adjustment quantity delta cannot be zero') {
    super(message);
  }
}

export class AdjustmentWouldViolateReservationError extends AppError {
  constructor(message = 'Stock adjustment would violate active reservations') {
    super(message, 400, 'ADJUSTMENT_WOULD_VIOLATE_RESERVATION');
  }
}

export class InvalidStockAdjustmentError extends ValidationError {
  constructor(message = 'Invalid stock adjustment input') {
    super(message);
  }
}

// BOM Management Engine Errors (Phase 031)
export class BomNotFoundError extends AppError {
  constructor(message = 'BOM not found') {
    super(message, 404, 'BOM_NOT_FOUND');
  }
}

export class BomComponentNotFoundError extends AppError {
  constructor(message = 'BOM component not found') {
    super(message, 404, 'BOM_COMPONENT_NOT_FOUND');
  }
}

export class BomProductNotFoundError extends AppError {
  constructor(message = 'Product specified in BOM not found') {
    super(message, 404, 'BOM_PRODUCT_NOT_FOUND');
  }
}

export class BomSelfReferenceError extends AppError {
  constructor(message = 'BOM parent product cannot be used as a component product') {
    super(message, 400, 'BOM_SELF_REFERENCE');
  }
}

export class BomEmptyError extends AppError {
  constructor(message = 'BOM must contain at least one component to be activated') {
    super(message, 400, 'BOM_EMPTY');
  }
}

export class BomInvalidStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;
  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition BOM from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_BOM_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class BomAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `BOM is already in '${status}' status`;
    super(msg, 400, 'BOM_ALREADY_IN_STATE');
  }
}

export class BomDuplicateBomNumberError extends AppError {
  constructor(message = 'BOM number already exists for this organization') {
    super(message, 409, 'DUPLICATE_BOM_NUMBER');
  }
}

export class BomDuplicateRevisionError extends AppError {
  constructor(message = 'BOM revision already exists for this product') {
    super(message, 409, 'DUPLICATE_BOM_REVISION');
  }
}

export class BomDefaultConflictError extends AppError {
  constructor(message = 'Only active BOMs can be set as default') {
    super(message, 400, 'BOM_DEFAULT_CONFLICT');
  }
}

export class BomEffectiveDateError extends AppError {
  constructor(message = 'Effective end date cannot be earlier than effective start date') {
    super(message, 400, 'BOM_EFFECTIVE_DATE_INVALID');
  }
}

export class BomInvalidQuantityError extends AppError {
  constructor(message = 'BOM component quantity must be greater than zero') {
    super(message, 400, 'BOM_INVALID_QUANTITY');
  }
}

export class BomInvalidScrapPercentageError extends AppError {
  constructor(message = 'Scrap percentage must be between 0 and 100') {
    super(message, 400, 'BOM_INVALID_SCRAP_PERCENTAGE');
  }
}

export class BomImmutableError extends AppError {
  constructor(message = 'BOM components cannot be modified unless BOM status is DRAFT') {
    super(message, 400, 'BOM_IMMUTABLE');
  }
}

export class BomDuplicateComponentError extends AppError {
  constructor(message = 'Component product already exists in this BOM') {
    super(message, 409, 'DUPLICATE_BOM_COMPONENT');
  }
}

export class BomCircularDependencyError extends AppError {
  constructor(message = 'Circular dependency detected in BOM structure') {
    super(message, 400, 'BOM_CIRCULAR_DEPENDENCY');
  }
}

// BOM Explosion Engine Errors (Phase 032)
export class BomProductMismatchError extends AppError {
  constructor(message = 'BOM does not match requested product') {
    super(message, 400, 'BOM_PRODUCT_MISMATCH');
  }
}

// Audit Errors (Phase 056)
export class AuditLogImmutableError extends AppError {
  constructor(message = 'Audit log records are strictly immutable and cannot be mutated or deleted') {
    super(message, 403, 'AUDIT_LOG_IMMUTABLE');
  }
}

export class AuditExportLimitExceededError extends AppError {
  constructor(message = 'Export requested record count exceeds maximum allowed limit of 10000') {
    super(message, 400, 'AUDIT_EXPORT_LIMIT_EXCEEDED');
  }
}

export class InvalidAuditFilterError extends AppError {
  constructor(message = 'Invalid audit search filter parameters') {
    super(message, 400, 'INVALID_AUDIT_FILTER');
  }
}

export class BomExplosionError extends AppError {
  constructor(message = 'BOM explosion error', statusCode = 400, code = 'BOM_EXPLOSION_ERROR') {
    super(message, statusCode, code);
  }
}

export class ActiveBomNotFoundError extends AppError {
  constructor(message = 'No active BOM found for product') {
    super(message, 404, 'ACTIVE_BOM_NOT_FOUND');
  }
}

export class BomCircularReferenceError extends AppError {
  constructor(message = 'Circular dependency detected in BOM hierarchy') {
    super(message, 400, 'BOM_CIRCULAR_REFERENCE');
  }
}

export class BomExplosionMaxDepthError extends AppError {
  constructor(message = 'Maximum BOM explosion depth exceeded') {
    super(message, 400, 'BOM_EXPLOSION_MAX_DEPTH_EXCEEDED');
  }
}

export class InvalidExplosionQuantityError extends ValidationError {
  constructor(message = 'Explosion quantity must be a positive number greater than zero') {
    super(message);
  }
}

// Manufacturing Order Errors (Phase 033)
export class ManufacturingOrderNotFoundError extends AppError {
  constructor(message = 'Manufacturing order not found') {
    super(message, 404, 'MANUFACTURING_ORDER_NOT_FOUND');
  }
}

export class ManufacturingOrderItemNotFoundError extends AppError {
  constructor(message = 'Manufacturing order item not found') {
    super(message, 404, 'MANUFACTURING_ORDER_ITEM_NOT_FOUND');
  }
}

export class InvalidManufacturingOrderStateTransitionError extends AppError {
  public readonly currentStatus: string;
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, message?: string) {
    const msg =
      message || `Cannot transition manufacturing order from status '${currentStatus}' to '${targetStatus}'`;
    super(msg, 400, 'INVALID_MANUFACTURING_ORDER_STATE_TRANSITION');
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class ManufacturingOrderAlreadyInStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Manufacturing order is already in state '${status}'`;
    super(msg, 400, 'MANUFACTURING_ORDER_ALREADY_IN_STATE');
  }
}

export class DuplicateManufacturingOrderNumberError extends AppError {
  constructor(message = 'Manufacturing order number already exists in organization') {
    super(message, 409, 'DUPLICATE_MANUFACTURING_ORDER_NUMBER');
  }
}

export class InvalidManufacturingOrderQuantityError extends AppError {
  constructor(message = 'Planned quantity must be greater than zero') {
    super(message, 400, 'INVALID_MANUFACTURING_ORDER_QUANTITY');
  }
}

export class ManufacturingOrderBomNotFoundError extends AppError {
  constructor(message = 'BOM specified in manufacturing order not found') {
    super(message, 404, 'MANUFACTURING_ORDER_BOM_NOT_FOUND');
  }
}

export class ManufacturingOrderBomInactiveError extends AppError {
  constructor(message = 'BOM specified in manufacturing order is not active') {
    super(message, 400, 'MANUFACTURING_ORDER_BOM_INACTIVE');
  }
}

export class ManufacturingOrderProductMismatchError extends AppError {
  constructor(message = 'BOM product does not match manufacturing order product') {
    super(message, 400, 'MANUFACTURING_ORDER_PRODUCT_MISMATCH');
  }
}

export class ManufacturingOrderWarehouseNotFoundError extends AppError {
  constructor(message = 'Warehouse specified in manufacturing order not found') {
    super(message, 404, 'MANUFACTURING_ORDER_WAREHOUSE_NOT_FOUND');
  }
}

export class ManufacturingOrderImmutableError extends AppError {
  constructor(message = 'Manufacturing order cannot be modified in its current state') {
    super(message, 400, 'MANUFACTURING_ORDER_IMMUTABLE');
  }
}

export class ManufacturingOrderMissingComponentsError extends AppError {
  constructor(message = 'Manufacturing order has no component requirements') {
    super(message, 400, 'MANUFACTURING_ORDER_MISSING_COMPONENTS');
  }
}

export class ManufacturingOrderTerminalStateError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Manufacturing order is in terminal state '${status}' and cannot transition`;
    super(msg, 400, 'MANUFACTURING_ORDER_TERMINAL_STATE');
  }
}

export class ManufacturingOrderTransitionNotAuthorizedError extends AppError {
  constructor(message = 'User is not authorized to execute this manufacturing order state transition') {
    super(message, 403, 'MANUFACTURING_ORDER_TRANSITION_NOT_AUTHORIZED');
  }
}

export class ManufacturingOrderTransitionGuardError extends AppError {
  constructor(message = 'Manufacturing order state transition precondition guard failed') {
    super(message, 400, 'MANUFACTURING_ORDER_TRANSITION_GUARD_FAILED');
  }
}

export class ManufacturingOrderCancellationNotAllowedError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Manufacturing order in state '${status}' cannot be cancelled`;
    super(msg, 400, 'MANUFACTURING_ORDER_CANCELLATION_NOT_ALLOWED');
  }
}

// Component Availability Errors (Phase 035)
export class ManufacturingOrderComponentShortageError extends AppError {
  public readonly shortages: unknown[];

  constructor(
    moId: string,
    shortages: unknown[],
    message?: string,
  ) {
    const msg =
      message ||
      `Manufacturing order ${moId} cannot start because required components are unavailable (${shortages.length} component(s) short)`;
    super(msg, 400, 'COMPONENT_SHORTAGE');
    this.shortages = shortages;
  }
}

export class ComponentAvailabilityCalculationError extends AppError {
  constructor(message = 'Failed to calculate component availability') {
    super(message, 400, 'COMPONENT_AVAILABILITY_CALCULATION_ERROR');
  }
}

// Material Consumption Errors (Phase 036)
export class ManufacturingOrderNotInProgressError extends AppError {
  constructor(status: string, message?: string) {
    const msg = message || `Material consumption is only allowed when manufacturing order is in_progress (current state: '${status}')`;
    super(msg, 400, 'MANUFACTURING_ORDER_NOT_IN_PROGRESS');
  }
}

export class ManufacturingMaterialOverConsumptionError extends AppError {
  public readonly details: {
    required_quantity: string;
    consumed_quantity: string;
    remaining_quantity: string;
    requested_quantity: string;
    product_id: string;
  };

  constructor(
    details: {
      required_quantity: string;
      consumed_quantity: string;
      remaining_quantity: string;
      requested_quantity: string;
      product_id: string;
    },
    message?: string,
  ) {
    const msg =
      message ||
      `Requested consumption ${details.requested_quantity} exceeds remaining requirement ${details.remaining_quantity} for product ${details.product_id}`;
    super(msg, 400, 'MANUFACTURING_MATERIAL_OVER_CONSUMPTION');
    this.details = details;
  }
}

export class ManufacturingMaterialItemNotFoundError extends AppError {
  constructor(itemId: string, message?: string) {
    const msg = message || `Manufacturing order component requirement item ${itemId} not found`;
    super(msg, 404, 'MANUFACTURING_MATERIAL_ITEM_NOT_FOUND');
  }
}

export class DuplicateManufacturingConsumptionError extends AppError {
  constructor(refNumber: string, message?: string) {
    const msg = message || `Material consumption reference number '${refNumber}' already exists in organization`;
    super(msg, 409, 'DUPLICATE_MANUFACTURING_CONSUMPTION');
  }
}

export class ManufacturingMaterialConsumptionNotFoundError extends AppError {
  constructor(id: string, message?: string) {
    const msg = message || `Manufacturing material consumption record ${id} not found`;
    super(msg, 404, 'MANUFACTURING_MATERIAL_CONSUMPTION_NOT_FOUND');
  }
}

// Finished Goods Production Errors (Phase 037)
export class ManufacturingProductionNotFoundError extends AppError {
  constructor(id: string, message?: string) {
    const msg = message || `Manufacturing production record ${id} not found`;
    super(msg, 404, 'MANUFACTURING_PRODUCTION_NOT_FOUND');
  }
}

export class ManufacturingOrderMaterialsNotFullyConsumedError extends AppError {
  constructor(moId: string, message?: string) {
    const msg =
      message ||
      `Manufacturing order ${moId} cannot produce finished goods because required component materials are not fully consumed`;
    super(msg, 400, 'MATERIALS_NOT_FULLY_CONSUMED');
  }
}

export class ManufacturingOrderOverProductionError extends AppError {
  public readonly details: {
    planned_quantity: string;
    produced_quantity: string;
    remaining_quantity: string;
    requested_quantity: string;
    product_id: string;
  };

  constructor(
    details: {
      planned_quantity: string;
      produced_quantity: string;
      remaining_quantity: string;
      requested_quantity: string;
      product_id: string;
    },
    message?: string,
  ) {
    const msg =
      message ||
      `Requested production ${details.requested_quantity} exceeds remaining production capacity ${details.remaining_quantity} for product ${details.product_id}`;
    super(msg, 400, 'MANUFACTURING_ORDER_OVER_PRODUCTION');
    this.details = details;
  }
}

export class DuplicateManufacturingProductionError extends AppError {
  constructor(productionNumber: string, message?: string) {
    const msg = message || `Production number '${productionNumber}' already exists in organization`;
    super(msg, 409, 'DUPLICATE_MANUFACTURING_PRODUCTION');
  }
}

export class ManufacturingOrderProductionIncompleteError extends AppError {
  public readonly details?: unknown;

  constructor(details?: unknown, message?: string) {
    const msg = message || 'Manufacturing order cannot be completed because finished goods production is incomplete';
    super(msg, 400, 'MANUFACTURING_ORDER_PRODUCTION_INCOMPLETE');
    this.details = details;
  }
}

export class ManufacturingProductionProductMismatchError extends AppError {
  constructor(requestedProduct: string, moProduct: string) {
    super(
      `Production product ID '${requestedProduct}' does not match Manufacturing Order product ID '${moProduct}'`,
      400,
      'MANUFACTURING_PRODUCTION_PRODUCT_MISMATCH',
    );
  }
}

export class ManufacturingProductionWarehouseMismatchError extends AppError {
  constructor(requestedWarehouse: string, moWarehouse: string) {
    super(
      `Production warehouse ID '${requestedWarehouse}' does not match Manufacturing Order warehouse ID '${moWarehouse}'`,
      400,
      'MANUFACTURING_PRODUCTION_WAREHOUSE_MISMATCH',
    );
  }
}

// Rollback & Compensation Errors (Phase 038)
export class ManufacturingMaterialReversalExceedsConsumedError extends AppError {
  constructor(requestedReversal: string, consumedQuantity: string, message?: string) {
    const msg =
      message ||
      `Requested material consumption reversal quantity ${requestedReversal} exceeds consumed quantity ${consumedQuantity}`;
    super(msg, 400, 'MATERIAL_REVERSAL_EXCEEDS_CONSUMED');
  }
}

export class ManufacturingProductionReversalExceedsProducedError extends AppError {
  constructor(requestedReversal: string, producedQuantity: string, message?: string) {
    const msg =
      message ||
      `Requested finished-goods production reversal quantity ${requestedReversal} exceeds produced quantity ${producedQuantity}`;
    super(msg, 400, 'PRODUCTION_REVERSAL_EXCEEDS_PRODUCED');
  }
}

export class ManufacturingOrderCancellationWithActiveProductionError extends AppError {
  constructor(moId: string, producedQuantity: string) {
    super(
      `Manufacturing order ${moId} cannot be cancelled because it has ${producedQuantity} produced finished goods. Reverse finished goods production first.`,
      400,
      'CANCELLATION_WITH_ACTIVE_PRODUCTION',
    );
  }
}

export class DuplicateManufacturingReversalError extends AppError {
  constructor(reversalNumber: string) {
    super(
      `Reversal number '${reversalNumber}' already exists in organization`,
      409,
      'DUPLICATE_MANUFACTURING_REVERSAL',
    );
  }
}

export class ManufacturingReversalNotFoundError extends AppError {
  constructor(id: string) {
    super(`Manufacturing reversal record ${id} not found`, 404, 'MANUFACTURING_REVERSAL_NOT_FOUND');
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
  };
}
