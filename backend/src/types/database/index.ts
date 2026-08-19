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
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
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
  quantity: number;
  reorder_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInventoryInput {
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  quantity?: number;
  reorder_level?: number;
}

export interface UpdateInventoryInput {
  quantity?: number;
  reorder_level?: number;
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
