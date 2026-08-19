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
export interface Bom {
  id: string;
  organization_id: string;
  product_id: string;
  bom_code: string;
  name: string;
  version: number;
  status: 'draft' | 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateBomInput {
  organization_id: string;
  product_id: string;
  bom_code: string;
  name: string;
  version?: number;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateBomInput {
  product_id?: string;
  name?: string;
  version?: number;
  status?: 'draft' | 'active' | 'inactive';
}

// BOM Item
export interface BomItem {
  id: string;
  organization_id: string;
  bom_id: string;
  component_product_id: string;
  quantity: string | number;
  unit: string;
  sequence: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBomItemInput {
  organization_id: string;
  bom_id: string;
  component_product_id: string;
  quantity?: string | number;
  unit?: string;
  sequence?: number;
}

export interface UpdateBomItemInput {
  component_product_id?: string;
  quantity?: string | number;
  unit?: string;
  sequence?: number;
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
export interface PurchaseOrder {
  id: string;
  organization_id: string;
  supplier_id: string;
  order_number: string;
  order_date: Date;
  expected_delivery_date: Date | null;
  status: 'draft' | 'submitted' | 'approved' | 'processing' | 'received' | 'completed' | 'cancelled';
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
  order_number: string;
  order_date?: Date | string;
  expected_delivery_date?: Date | string | null;
  status?: 'draft' | 'submitted' | 'approved' | 'processing' | 'received' | 'completed' | 'cancelled';
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
  notes?: string | null;
}

export interface UpdatePurchaseOrderInput {
  supplier_id?: string;
  order_date?: Date | string;
  expected_delivery_date?: Date | string | null;
  status?: 'draft' | 'submitted' | 'approved' | 'processing' | 'received' | 'completed' | 'cancelled';
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
export interface ManufacturingOrder {
  id: string;
  organization_id: string;
  bom_id: string;
  product_id: string;
  order_number: string;
  planned_quantity: string | number;
  completed_quantity: string | number;
  scheduled_start_date: Date | null;
  scheduled_end_date: Date | null;
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  status: 'draft' | 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManufacturingOrderInput {
  organization_id: string;
  bom_id: string;
  product_id: string;
  order_number: string;
  planned_quantity?: string | number;
  completed_quantity?: string | number;
  scheduled_start_date?: Date | string | null;
  scheduled_end_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  status?: 'draft' | 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
}

export interface UpdateManufacturingOrderInput {
  bom_id?: string;
  product_id?: string;
  planned_quantity?: string | number;
  completed_quantity?: string | number;
  scheduled_start_date?: Date | string | null;
  scheduled_end_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  status?: 'draft' | 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
}

// Manufacturing Order Item
export interface ManufacturingOrderItem {
  id: string;
  organization_id: string;
  manufacturing_order_id: string;
  component_product_id: string;
  bom_item_id: string | null;
  required_quantity: string | number;
  consumed_quantity: string | number;
  unit: string;
  sequence: number;
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
}

export interface UpdateManufacturingOrderItemInput {
  component_product_id?: string;
  bom_item_id?: string | null;
  required_quantity?: string | number;
  consumed_quantity?: string | number;
  unit?: string;
  sequence?: number;
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
