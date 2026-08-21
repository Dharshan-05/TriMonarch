// Organization
export interface Organization {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationInput {
  name: string;
  code: string;
  description?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
}

// User
export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash?: string | null;
  last_login_at?: Date | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  organization_id: string;
  name: string;
  email: string;
  phone?: string | null;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

// Role
export interface Role {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoleInput {
  organization_id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

// UserRole
export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: Date;
}

// Department
export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateDepartmentInput {
  organization_id: string;
  name: string;
  code: string;
  description?: string | null;
  status?: 'active' | 'inactive';
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
  status?: 'active' | 'inactive';
}

// Employee
export interface Employee {
  id: string;
  organization_id: string;
  user_id: string | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  job_title: string | null;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  joining_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmployeeInput {
  organization_id: string;
  user_id?: string | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department_id?: string | null;
  job_title?: string | null;
  employment_status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  joining_date?: Date | string;
}

export interface UpdateEmployeeInput {
  user_id?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  department_id?: string | null;
  job_title?: string | null;
  employment_status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  joining_date?: Date | string;
}

// Product
export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  price?: string | number;
  cost?: string | number;
  tax_rate?: string | number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  organization_id: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  price?: string | number;
  cost?: string | number;
  tax_rate?: string | number;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  price?: string | number;
  cost?: string | number;
  tax_rate?: string | number;
  status?: 'active' | 'inactive' | 'discontinued';
}

// Warehouse
export interface Warehouse {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  location: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateWarehouseInput {
  organization_id: string;
  name: string;
  code: string;
  location?: string | null;
  status?: 'active' | 'inactive';
}

export interface UpdateWarehouseInput {
  name?: string;
  location?: string | null;
  status?: 'active' | 'inactive';
}

// Inventory
export interface Inventory {
  id: string;
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number | string;
  reorder_level: number | string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInventoryInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity?: number | string;
  reorder_level?: number | string;
}

export interface UpdateInventoryInput {
  quantity?: number | string;
  reorder_level?: number | string;
}

// Customer
export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerInput {
  organization_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: 'active' | 'inactive';
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: 'active' | 'inactive';
}

// Supplier
export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierInput {
  organization_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: 'active' | 'inactive';
}

export interface UpdateSupplierInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: 'active' | 'inactive';
}

// BOM (Bill of Materials)
export type BomStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Bom {
  id: string;
  organization_id: string;
  product_id: string;
  bom_number: string;
  bom_code?: string;
  revision: string;
  version?: number;
  name?: string;
  status: BomStatus;
  effective_from: Date | string | null;
  effective_to: Date | string | null;
  is_default: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBomInput {
  organization_id: string;
  product_id: string;
  bom_number?: string;
  bom_code?: string;
  revision?: string;
  version?: number;
  name?: string;
  status?: BomStatus;
  effective_from?: Date | string | null;
  effective_to?: Date | string | null;
  is_default?: boolean;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdateBomInput {
  product_id?: string;
  bom_number?: string;
  bom_code?: string;
  revision?: string;
  version?: number;
  name?: string;
  status?: BomStatus;
  effective_from?: Date | string | null;
  effective_to?: Date | string | null;
  is_default?: boolean;
  notes?: string | null;
  updated_by?: string | null;
}

// BOM Item / Component
export interface BomItem {
  id: string;
  organization_id: string;
  bom_id: string;
  component_product_id: string;
  quantity: string | number;
  unit: string;
  scrap_percentage: string | number;
  sequence: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBomItemInput {
  organization_id: string;
  bom_id: string;
  component_product_id: string;
  quantity?: string | number;
  unit?: string;
  scrap_percentage?: string | number;
  sequence?: number;
  notes?: string | null;
}

export interface UpdateBomItemInput {
  component_product_id?: string;
  quantity?: string | number;
  unit?: string;
  scrap_percentage?: string | number;
  sequence?: number;
  notes?: string | null;
}

// Sales Order
export interface SalesOrder {
  id: string;
  organization_id: string;
  customer_id: string;
  order_number: string;
  order_date: Date;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  currency: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSalesOrderInput {
  organization_id: string;
  customer_id: string;
  order_number: string;
  order_date?: Date | string;
  status?: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  notes?: string | null;
}

export interface UpdateSalesOrderInput {
  customer_id?: string;
  order_number?: string;
  order_date?: Date | string;
  status?: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  notes?: string | null;
}

// Sales Order Item
export interface SalesOrderItem {
  id: string;
  organization_id: string;
  sales_order_id: string;
  product_id: string;
  quantity: string | number;
  unit_price: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  line_total: string | number;
  sequence: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSalesOrderItemInput {
  organization_id: string;
  sales_order_id: string;
  product_id: string;
  quantity?: string | number;
  unit_price?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
  sequence?: number;
}

export interface UpdateSalesOrderItemInput {
  product_id?: string;
  quantity?: string | number;
  unit_price?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
  sequence?: number;
}

// Purchase Order
export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'processing'
  | 'partially_received'
  | 'received'
  | 'completed'
  | 'cancelled';

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  supplier_id: string;
  warehouse_id: string | null;
  order_number: string;
  order_date: Date;
  expected_delivery_date: Date | null;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePurchaseOrderInput {
  organization_id: string;
  supplier_id: string;
  warehouse_id?: string | null;
  order_number: string;
  order_date?: Date | string;
  expected_delivery_date?: Date | string | null;
  status?: PurchaseOrderStatus;
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  notes?: string | null;
}

export interface UpdatePurchaseOrderInput {
  supplier_id?: string;
  warehouse_id?: string | null;
  order_number?: string;
  order_date?: Date | string;
  expected_delivery_date?: Date | string | null;
  status?: PurchaseOrderStatus;
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  notes?: string | null;
}

// Purchase Order Item
export interface PurchaseOrderItem {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: string | number;
  unit_cost: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  line_total: string | number;
  sequence: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePurchaseOrderItemInput {
  organization_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity?: string | number;
  unit_cost?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
  sequence?: number;
}

export interface UpdatePurchaseOrderItemInput {
  product_id?: string;
  quantity?: string | number;
  unit_cost?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
  sequence?: number;
}

// Manufacturing Order
export type ManufacturingOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ManufacturingOrder {
  id: string;
  organization_id: string;
  bom_id: string;
  product_id: string;
  warehouse_id?: string | null;
  order_number: string;
  mo_number?: string | null;
  planned_quantity: string | number;
  completed_quantity: string | number;
  produced_quantity?: string | number;
  scheduled_start_date: Date | null;
  scheduled_end_date: Date | null;
  planned_start_date?: Date | null;
  planned_end_date?: Date | null;
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  status: ManufacturingOrderStatus;
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManufacturingOrderInput {
  organization_id: string;
  bom_id: string;
  product_id: string;
  warehouse_id?: string | null;
  order_number?: string;
  mo_number?: string;
  planned_quantity?: string | number;
  completed_quantity?: string | number;
  scheduled_start_date?: Date | string | null;
  scheduled_end_date?: Date | string | null;
  planned_start_date?: Date | string | null;
  planned_end_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  status?: ManufacturingOrderStatus;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdateManufacturingOrderInput {
  bom_id?: string;
  product_id?: string;
  warehouse_id?: string | null;
  order_number?: string;
  mo_number?: string;
  planned_quantity?: string | number;
  completed_quantity?: string | number;
  produced_quantity?: string | number;
  scheduled_start_date?: Date | string | null;
  scheduled_end_date?: Date | string | null;
  planned_start_date?: Date | string | null;
  planned_end_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  status?: ManufacturingOrderStatus;
  notes?: string | null;
  updated_by?: string | null;
}

// Manufacturing Order Item
export interface ManufacturingOrderItem {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  component_product_id: string;
  product_id?: string;
  bom_item_id: string | null;
  required_quantity: string | number;
  consumed_quantity: string | number;
  unit: string;
  unit_of_measure?: string;
  sequence: number;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManufacturingOrderItemInput {
  organization_id: string;
  manufacturing_order_id: string;
  component_product_id: string;
  bom_item_id?: string | null;
  required_quantity?: string | number;
  consumed_quantity?: string | number;
  unit?: string;
  sequence?: number;
  notes?: string | null;
}

export interface UpdateManufacturingOrderItemInput {
  component_product_id?: string;
  bom_item_id?: string | null;
  required_quantity?: string | number;
  consumed_quantity?: string | number;
  unit?: string;
  sequence?: number;
  notes?: string | null;
}

// Manufacturing Order Status History
export interface ManufacturingOrderStatusHistory {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  from_status: ManufacturingOrderStatus;
  to_status: ManufacturingOrderStatus;
  changed_by: string | null;
  reason: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface CreateManufacturingOrderStatusHistoryInput {
  organization_id: string;
  manufacturing_order_id: string;
  from_status: ManufacturingOrderStatus;
  to_status: ManufacturingOrderStatus;
  changed_by?: string | null;
  reason?: string | null;
  request_id?: string | null;
  metadata?: Record<string, unknown>;
}

// Manufacturing Material Consumptions
export interface ManufacturingMaterialConsumption {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_order_item_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  consumed_at: Date;
  consumed_by: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CreateManufacturingMaterialConsumptionInput {
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_order_item_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  consumed_at?: Date;
  consumed_by?: string | null;
  reference_number?: string | null;
  notes?: string | null;
}

// Manufacturing Finished Goods Productions (Phase 037)
export interface ManufacturingProduction {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  product_id: string;
  warehouse_id: string;
  production_number: string;
  quantity: string | number;
  produced_by: string | null;
  produced_at: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManufacturingProductionInput {
  organization_id: string;
  manufacturing_order_id: string;
  product_id: string;
  warehouse_id: string;
  production_number: string;
  quantity: string | number;
  produced_by?: string | null;
  produced_at?: Date;
  notes?: string | null;
}

// Manufacturing Reversals (Phase 038)
export interface ManufacturingConsumptionReversal {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_material_consumption_id: string | null;
  manufacturing_order_item_id: string;
  product_id: string;
  warehouse_id: string;
  reversal_number: string;
  quantity: string | number;
  reversed_by: string | null;
  reversed_at: Date;
  reason: string | null;
  created_at: Date;
}

export interface CreateManufacturingConsumptionReversalInput {
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_material_consumption_id?: string | null;
  manufacturing_order_item_id: string;
  product_id: string;
  warehouse_id: string;
  reversal_number: string;
  quantity: string | number;
  reversed_by?: string | null;
  reversed_at?: Date;
  reason?: string | null;
}

export interface ManufacturingProductionReversal {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_production_id: string | null;
  product_id: string;
  warehouse_id: string;
  reversal_number: string;
  quantity: string | number;
  reversed_by: string | null;
  reversed_at: Date;
  reason: string | null;
  created_at: Date;
}

export interface CreateManufacturingProductionReversalInput {
  organization_id: string;
  manufacturing_order_id: string;
  manufacturing_production_id?: string | null;
  product_id: string;
  warehouse_id: string;
  reversal_number: string;
  quantity: string | number;
  reversed_by?: string | null;
  reversed_at?: Date;
  reason?: string | null;
}

// Stock Ledger
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface StockLedgerEntry {
  id: string;
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: StockMovementType;
  quantity: string | number;
  unit: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CreateStockLedgerInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: StockMovementType;
  quantity: string | number;
  unit?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
}

export interface StockMovementSummary {
  total_in: string;
  total_out: string;
  total_adjustment: string;
  current_stock: string;
  movement_count: number;
}

// Stock Reservation
export type StockReservationStatus = 'active' | 'released' | 'consumed' | 'cancelled' | 'expired';

export interface StockReservation {
  id: string;
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  status: StockReservationStatus;
  reference_type: string | null;
  reference_id: string | null;
  expires_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStockReservationInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: string | number;
  status?: StockReservationStatus;
  reference_type?: string | null;
  reference_id?: string | null;
  expires_at?: Date | string | null;
  notes?: string | null;
}

export interface UpdateStockReservationInput {
  quantity?: string | number;
  status?: StockReservationStatus;
  expires_at?: Date | string | null;
  notes?: string | null;
}

// Sales Delivery
export type SalesDeliveryStatus =
  | 'draft'
  | 'confirmed'
  | 'picking'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface SalesDelivery {
  id: string;
  organization_id: string;
  sales_order_id: string;
  delivery_number: string;
  warehouse_id: string;
  status: SalesDeliveryStatus;
  delivery_date: Date;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSalesDeliveryInput {
  organization_id: string;
  sales_order_id: string;
  delivery_number?: string;
  warehouse_id: string;
  delivery_date?: Date | string;
  status?: SalesDeliveryStatus;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdateSalesDeliveryInput {
  warehouse_id?: string;
  delivery_date?: Date | string;
  status?: SalesDeliveryStatus;
  shipped_at?: Date | string | null;
  delivered_at?: Date | string | null;
  cancelled_at?: Date | string | null;
  notes?: string | null;
  updated_by?: string | null;
}

export interface SalesDeliveryFilterParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
  query?: string;
  salesOrderId?: string;
  warehouseId?: string;
  status?: SalesDeliveryStatus;
}

// Sales Delivery Item
export interface SalesDeliveryItem {
  id: string;
  organization_id: string;
  delivery_id: string;
  sales_order_item_id: string;
  product_id: string;
  quantity: string | number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSalesDeliveryItemInput {
  organization_id: string;
  delivery_id: string;
  sales_order_item_id: string;
  product_id: string;
  quantity: string | number;
}

// Purchase Receipt
export type PurchaseReceiptStatus = 'draft' | 'posted' | 'completed' | 'cancelled';

export interface PurchaseReceipt {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  receipt_number: string;
  warehouse_id: string;
  status: PurchaseReceiptStatus;
  receipt_date: Date;
  received_at: Date | null;
  cancelled_at: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePurchaseReceiptInput {
  organization_id: string;
  purchase_order_id: string;
  receipt_number?: string;
  warehouse_id: string;
  status?: PurchaseReceiptStatus;
  receipt_date?: Date | string;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdatePurchaseReceiptInput {
  warehouse_id?: string;
  status?: PurchaseReceiptStatus;
  receipt_date?: Date | string;
  received_at?: Date | string | null;
  cancelled_at?: Date | string | null;
  notes?: string | null;
  updated_by?: string | null;
}

export interface PurchaseReceiptItem {
  id: string;
  organization_id: string;
  receipt_id: string;
  purchase_order_item_id: string;
  product_id: string;
  quantity: string | number;
  unit_cost: string | number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePurchaseReceiptItemInput {
  organization_id: string;
  receipt_id: string;
  purchase_order_item_id: string;
  product_id: string;
  quantity: string | number;
  unit_cost?: string | number;
}

export interface UpdatePurchaseReceiptItemInput {
  quantity?: string | number;
  unit_cost?: string | number;
}

// Supplier Invoice & Accounts Payable
export type SupplierInvoiceStatus = 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'other';

export interface SupplierInvoice {
  id: string;
  organization_id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  purchase_receipt_id: string | null;
  invoice_number: string;
  supplier_invoice_number: string;
  status: SupplierInvoiceStatus;
  invoice_date: Date;
  due_date: Date | null;
  currency: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierInvoiceInput {
  organization_id: string;
  supplier_id: string;
  purchase_order_id?: string | null;
  purchase_receipt_id?: string | null;
  invoice_number?: string;
  supplier_invoice_number: string;
  status?: SupplierInvoiceStatus;
  invoice_date?: Date | string;
  due_date?: Date | string | null;
  currency?: string;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  total_amount?: string | number;
  amount_paid?: string | number;
  amount_due?: string | number;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdateSupplierInvoiceInput {
  supplier_id?: string;
  purchase_order_id?: string | null;
  purchase_receipt_id?: string | null;
  supplier_invoice_number?: string;
  status?: SupplierInvoiceStatus;
  invoice_date?: Date | string;
  due_date?: Date | string | null;
  currency?: string;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  total_amount?: string | number;
  amount_paid?: string | number;
  amount_due?: string | number;
  notes?: string | null;
  updated_by?: string | null;
}

export interface SupplierInvoiceFilterParams {
  page?: number;
  limit?: number;
  query?: string;
  supplier_id?: string;
  purchase_order_id?: string;
  purchase_receipt_id?: string;
  status?: SupplierInvoiceStatus;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export interface SupplierInvoiceItem {
  id: string;
  organization_id: string;
  invoice_id: string;
  purchase_order_item_id: string | null;
  purchase_receipt_item_id: string | null;
  product_id: string;
  description: string | null;
  quantity: string | number;
  unit_cost: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  line_total: string | number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierInvoiceItemInput {
  organization_id: string;
  invoice_id: string;
  purchase_order_item_id?: string | null;
  purchase_receipt_item_id?: string | null;
  product_id: string;
  description?: string | null;
  quantity: string | number;
  unit_cost: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
}

export interface UpdateSupplierInvoiceItemInput {
  product_id?: string;
  description?: string | null;
  quantity?: string | number;
  unit_cost?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
  tax_amount?: string | number;
  line_total?: string | number;
}

export interface SupplierPayment {
  id: string;
  organization_id: string;
  supplier_invoice_id: string;
  supplier_id: string;
  payment_number: string;
  payment_date: Date;
  amount: string | number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierPaymentInput {
  organization_id: string;
  supplier_invoice_id: string;
  supplier_id: string;
  payment_number?: string;
  payment_date?: Date | string;
  amount: string | number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface SupplierPaymentFilterParams {
  page?: number;
  limit?: number;
  supplier_id?: string;
  supplier_invoice_id?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
}

// BOM Explosion Types (Phase 032)
export interface ExplodedComponentRequirement {
  product_id: string;
  product_code: string;
  product_name: string;
  required_quantity: string;
  unit_of_measure: string;
  source_bom_id: string;
  source_product_id: string;
  level: number;
  path: string[];
}

export interface BomExplosionResult {
  product_id: string;
  product_code: string;
  product_name: string;
  requested_quantity: string;
  bom_id: string;
  bom_number: string;
  bom_revision: string;
  max_depth: number;
  depth_reached: number;
  components: ExplodedComponentRequirement[];
}
