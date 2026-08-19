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
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = 'Validation failed', details: unknown = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
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
