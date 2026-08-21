# TriMonarch ERP — Complete Database Schema Reference

> All timestamps are `TIMESTAMPTZ` (UTC). All IDs are `UUID` generated via `gen_random_uuid()` or `uuid_generate_v4()`. All monetary/quantity values are `NUMERIC` with explicit precision. Every table with a `set_updated_at()` trigger auto-updates `updated_at` on modification.

---

## Table of Contents

1. [organizations](#1-organizations)
2. [users](#2-users)
3. [roles](#3-roles)
4. [user_roles](#4-user_roles)
5. [departments](#5-departments)
6. [employees](#6-employees)
7. [customers](#7-customers)
8. [suppliers](#8-suppliers)
9. [products](#9-products)
10. [warehouses](#10-warehouses)
11. [inventory](#11-inventory)
12. [stock_ledger](#12-stock_ledger)
13. [stock_reservations](#13-stock_reservations)
14. [sales_orders](#14-sales_orders)
15. [sales_order_items](#15-sales_order_items)
16. [sales_deliveries](#16-sales_deliveries)
17. [sales_delivery_items](#17-sales_delivery_items)
18. [purchase_orders](#18-purchase_orders)
19. [purchase_order_items](#19-purchase_order_items)
20. [purchase_receipts](#20-purchase_receipts)
21. [purchase_receipt_items](#21-purchase_receipt_items)
22. [supplier_invoices](#22-supplier_invoices)
23. [supplier_invoice_items](#23-supplier_invoice_items)
24. [supplier_payments](#24-supplier_payments)
25. [boms](#25-boms)
26. [bom_items](#26-bom_items)
27. [manufacturing_orders](#27-manufacturing_orders)
28. [manufacturing_order_items](#28-manufacturing_order_items)
29. [manufacturing_order_status_history](#29-manufacturing_order_status_history)
30. [manufacturing_material_consumptions](#30-manufacturing_material_consumptions)
31. [manufacturing_productions](#31-manufacturing_productions)
32. [manufacturing_reversals](#32-manufacturing_reversals)
33. [audit_logs](#33-audit_logs)
34. [auth_token_revocations](#34-auth_token_revocations)

---

## 1. organizations

**Purpose**: Root tenant entity. Every ERP domain record belongs to an organization.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Organization ID |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Display name |
| `code` | VARCHAR(50) | NO | — | UNIQUE | Short identifier |
| `description` | TEXT | YES | — | — | Optional description |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive,suspended)` | Org status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Indexes**: None beyond PK.
**Tenant**: IS the tenant root; no `organization_id`.

---

## 2. users

**Purpose**: Authenticated ERP users, scoped per organization.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | User ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning organization |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Full name |
| `email` | VARCHAR(255) | NO | — | UNIQUE (global) | Login email |
| `phone` | VARCHAR(50) | YES | — | — | Optional phone |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive,suspended,pending)` | Account status |
| `password_hash` | VARCHAR(255) | YES | — | — | Bcrypt hash (added m007) |
| `password_changed_at` | TIMESTAMPTZ | YES | — | — | Last password change |
| `last_login_at` | TIMESTAMPTZ | YES | — | — | Last successful login |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Indexes**: `idx_users_organization_id`, `idx_users_email`, `idx_users_status`
**Tenant**: `organization_id` (FK RESTRICT)

---

## 3. roles

**Purpose**: Named RBAC roles per organization.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Role ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` CASCADE | Owning org |
| `name` | VARCHAR(100) | NO | — | NOT NULL | Display name |
| `code` | VARCHAR(50) | NO | — | UNIQUE per org | Role code |
| `description` | TEXT | YES | — | — | Description |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_roles_org_code (organization_id, code)`
**Indexes**: `idx_roles_organization_id`

---

## 4. user_roles

**Purpose**: Junction table assigning roles to users (many-to-many).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `user_id` | UUID | NO | — | FK → `users(id)` CASCADE, PK(part) | User |
| `role_id` | UUID | NO | — | FK → `roles(id)` CASCADE, PK(part) | Role |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Assignment time |

**Primary Key**: `(user_id, role_id)`
**Indexes**: `idx_user_roles_role_id`

---

## 5. departments

**Purpose**: Organizational departments for HR/employee management.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Department ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Department name |
| `code` | VARCHAR(50) | NO | — | UNIQUE per org | Department code |
| `description` | TEXT | YES | — | — | Description |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive)` | Status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_departments_org_code (organization_id, code)`
**Indexes**: `idx_departments_organization_id`

---

## 6. employees

**Purpose**: Employee records linked optionally to a user account.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Employee ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `user_id` | UUID | YES | — | FK → `users(id)` SET NULL | Linked user (optional) |
| `employee_code` | VARCHAR(50) | NO | — | UNIQUE per org | Employee code |
| `first_name` | VARCHAR(100) | NO | — | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NO | — | NOT NULL | Last name |
| `email` | VARCHAR(255) | NO | — | NOT NULL | Work email |
| `phone` | VARCHAR(50) | YES | — | — | Phone |
| `department_id` | UUID | YES | — | FK → `departments(id)` SET NULL | Department |
| `job_title` | VARCHAR(100) | YES | — | — | Job title |
| `employment_status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive,terminated,on_leave)` | Status |
| `joining_date` | DATE | NO | `CURRENT_DATE` | — | Start date |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_employees_org_code (organization_id, employee_code)`
**Indexes**: `idx_employees_organization_id`, `idx_employees_department_id`, `idx_employees_user_id`

---

## 7. customers

**Purpose**: Customer master data (trading partners that buy from the org).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Customer ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Customer name |
| `email` | VARCHAR(255) | YES | — | — | Contact email |
| `phone` | VARCHAR(50) | YES | — | — | Phone |
| `address` | TEXT | YES | — | — | Postal address |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive)` | Status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Indexes**: `idx_customers_organization_id`

---

## 8. suppliers

**Purpose**: Supplier master data (trading partners that sell to the org).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Supplier ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Supplier name |
| `email` | VARCHAR(255) | YES | — | — | Contact email |
| `phone` | VARCHAR(50) | YES | — | — | Phone |
| `address` | TEXT | YES | — | — | Postal address |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive)` | Status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Indexes**: `idx_suppliers_organization_id`

---

## 9. products

**Purpose**: Product / item master data catalog.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Product ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `sku` | VARCHAR(100) | NO | — | UNIQUE per org | Stock-keeping unit |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Product name |
| `description` | TEXT | YES | — | — | Description |
| `category` | VARCHAR(100) | YES | — | — | Category label |
| `unit` | VARCHAR(50) | NO | `'pcs'` | NOT NULL | Unit of measure |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive,discontinued)` | Product status |
| `price` | NUMERIC(19,4) | YES | — | `>= 0` | Selling price (added m010) |
| `cost` | NUMERIC(19,4) | YES | — | `>= 0` | Standard cost (added m010) |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_products_org_sku (organization_id, sku)`
**Indexes**: `idx_products_organization_id`, `idx_products_sku`, `idx_products_status`

---

## 10. warehouses

**Purpose**: Physical or virtual storage locations.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Warehouse ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `name` | VARCHAR(255) | NO | — | NOT NULL | Warehouse name |
| `code` | VARCHAR(50) | NO | — | UNIQUE per org | Warehouse code |
| `location` | TEXT | YES | — | — | Physical address |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(active,inactive)` | Status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_warehouses_org_code (organization_id, code)`
**Indexes**: `idx_warehouses_organization_id`

---

## 11. inventory

**Purpose**: Current stock balance per product per warehouse. Actual table name: `inventory` (aliased as `inventory_balances` in documentation).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Balance record ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `product_id` | UUID | NO | — | FK → `products(id)` CASCADE | Product |
| `warehouse_id` | UUID | NO | — | FK → `warehouses(id)` CASCADE | Warehouse |
| `quantity` | NUMERIC(15,4) | NO | `0` | CHECK `>= 0` | On-hand quantity |
| `reorder_level` | NUMERIC(15,4) | NO | `0` | CHECK `>= 0` | Reorder trigger level |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_inventory_product_warehouse (product_id, warehouse_id)`
**Indexes**: `idx_inventory_organization_id`, `idx_inventory_product_id`, `idx_inventory_warehouse_id`

---

## 12. stock_ledger

**Purpose**: Append-only double-entry stock movement journal.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Entry ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `product_id` | UUID | NO | — | FK → `products(id)` RESTRICT | Product |
| `warehouse_id` | UUID | NO | — | FK → `warehouses(id)` RESTRICT | Warehouse |
| `movement_type` | VARCHAR(50) | NO | — | CHECK `(IN,OUT,ADJUSTMENT,TRANSFER_IN,TRANSFER_OUT)` | Movement type |
| `quantity` | NUMERIC(19,4) | NO | — | NOT NULL | Movement qty (signed) |
| `unit` | VARCHAR(50) | NO | `'pcs'` | NOT NULL | Unit |
| `reference_type` | VARCHAR(100) | YES | — | — | Source document type |
| `reference_id` | UUID | YES | — | — | Source document ID |
| `notes` | TEXT | YES | — | — | Notes |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Movement timestamp |

**Indexes**: `idx_stock_ledger_organization_id`, `idx_stock_ledger_org_product`, `idx_stock_ledger_org_warehouse`, `idx_stock_ledger_org_prod_wh`, `idx_stock_ledger_org_created`, `idx_stock_ledger_org_movement`, `idx_stock_ledger_org_reference`

---

## 13. sales_orders

**Purpose**: Customer sales order header.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Order ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `customer_id` | UUID | NO | — | FK → `customers(id)` RESTRICT | Customer |
| `order_number` | VARCHAR(100) | NO | — | UNIQUE per org | Order number |
| `order_date` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Order date |
| `status` | VARCHAR(50) | NO | `'draft'` | CHECK `(draft,confirmed,processing,shipped,completed,cancelled)` | Status |
| `currency` | VARCHAR(10) | NO | `'USD'` | NOT NULL | Currency code |
| `subtotal` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Pre-tax total |
| `tax_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Tax |
| `discount_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Discounts |
| `total_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Net total |
| `notes` | TEXT | YES | — | — | Notes |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_sales_orders_org_number (organization_id, order_number)`
**Indexes**: `idx_sales_orders_organization_id`, `idx_sales_orders_org_customer`, `idx_sales_orders_org_number`, `idx_sales_orders_org_status`, `idx_sales_orders_org_date`

---

## 14. sales_order_items

**Purpose**: Line items on a sales order.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Line ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `sales_order_id` | UUID | NO | — | FK → `sales_orders(id)` CASCADE | Parent order |
| `product_id` | UUID | NO | — | FK → `products(id)` RESTRICT | Product |
| `quantity` | NUMERIC(19,4) | NO | `1.0000` | CHECK `>= 0` | Ordered quantity |
| `unit_price` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Price per unit |
| `discount_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Line discount |
| `tax_rate` | NUMERIC(19,6) | NO | `0.000000` | CHECK `>= 0` | Tax rate |
| `tax_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Line tax |
| `line_total` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Line total |
| `sequence` | INT | NO | `1` | CHECK `> 0` | Line sequence |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_sales_order_items_order_seq (sales_order_id, sequence)`
**Indexes**: `idx_sales_order_items_organization_id`, `idx_sales_order_items_org_order`, `idx_sales_order_items_org_product`

---

## 15. purchase_orders

**Purpose**: Supplier purchase order header.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | PO ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `supplier_id` | UUID | NO | — | FK → `suppliers(id)` RESTRICT | Supplier |
| `order_number` | VARCHAR(100) | NO | — | UNIQUE per org | PO number |
| `order_date` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | PO date |
| `expected_delivery_date` | TIMESTAMPTZ | YES | — | — | Expected delivery |
| `status` | VARCHAR(50) | NO | `'draft'` | CHECK `(draft,submitted,approved,processing,received,completed,cancelled)` | Status |
| `currency` | VARCHAR(10) | NO | `'USD'` | NOT NULL | Currency |
| `subtotal` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Pre-tax total |
| `tax_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Tax |
| `discount_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Discount |
| `total_amount` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Net total |
| `notes` | TEXT | YES | — | — | Notes |
| `warehouse_id` | UUID | YES | — | FK → `warehouses(id)` (added m019) | Target warehouse |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_purchase_orders_org_number (organization_id, order_number)`

---

## 16. boms

**Purpose**: Bill of Materials header — defines what a finished product is made of.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | BOM ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `product_id` | UUID | NO | — | FK → `products(id)` RESTRICT | Finished product |
| `bom_code` | VARCHAR(100) | NO | — | UNIQUE per org | BOM code |
| `name` | VARCHAR(255) | NO | — | NOT NULL | BOM name |
| `version` | INT | NO | `1` | CHECK `> 0` | Version number |
| `status` | VARCHAR(50) | NO | `'active'` | CHECK `(draft,active,inactive)` | Status |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_boms_org_code (organization_id, bom_code)`
**Indexes**: `idx_boms_organization_id`, `idx_boms_org_product`, `idx_boms_org_code`, `idx_boms_org_status`

---

## 17. bom_items

**Purpose**: Component lines within a BOM.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Item ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `bom_id` | UUID | NO | — | FK → `boms(id)` CASCADE | Parent BOM |
| `component_product_id` | UUID | NO | — | FK → `products(id)` RESTRICT | Component product |
| `quantity` | NUMERIC(19,4) | NO | `1.0000` | CHECK `>= 0` | Required quantity |
| `unit` | VARCHAR(50) | NO | `'pcs'` | NOT NULL | Unit |
| `sequence` | INT | NO | `1` | CHECK `> 0` | Line sequence |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_bom_items_bom_seq (bom_id, sequence)`
**Indexes**: `idx_bom_items_organization_id`, `idx_bom_items_org_bom`, `idx_bom_items_org_component`

---

## 18. manufacturing_orders

**Purpose**: Work orders to manufacture a product per a BOM.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | MO ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` RESTRICT | Owning org |
| `bom_id` | UUID | NO | — | FK → `boms(id)` RESTRICT | BOM reference |
| `product_id` | UUID | NO | — | FK → `products(id)` RESTRICT | Output product |
| `order_number` | VARCHAR(100) | NO | — | UNIQUE per org | MO number |
| `planned_quantity` | NUMERIC(19,4) | NO | `1.0000` | CHECK `>= 0` | Planned qty |
| `completed_quantity` | NUMERIC(19,4) | NO | `0.0000` | CHECK `>= 0` | Completed qty |
| `scheduled_start_date` | TIMESTAMPTZ | YES | — | — | Planned start |
| `scheduled_end_date` | TIMESTAMPTZ | YES | — | — | Planned end |
| `actual_start_date` | TIMESTAMPTZ | YES | — | — | Actual start |
| `actual_end_date` | TIMESTAMPTZ | YES | — | — | Actual end |
| `status` | VARCHAR(50) | NO | `'draft'` | CHECK `(draft,planned,released,in_progress,completed,cancelled)` | Status |
| `notes` | TEXT | YES | — | — | Notes |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | Trigger updated | Last modified |

**Unique**: `uq_manufacturing_orders_org_number (organization_id, order_number)`
**Indexes**: `idx_manufacturing_orders_organization_id`, `idx_manufacturing_orders_org_number`, `idx_manufacturing_orders_org_bom`, `idx_manufacturing_orders_org_product`, `idx_manufacturing_orders_org_status`, `idx_manufacturing_orders_org_scheduled_start`

---

## 33. audit_logs

**Purpose**: Append-only, immutable audit trail of all domain mutations.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Audit record ID |
| `organization_id` | UUID | NO | — | FK → `organizations(id)` CASCADE | Owning org |
| `user_id` | UUID | YES | — | FK → `users(id)` SET NULL | Acting user |
| `action` | VARCHAR(50) | NO | — | NOT NULL | Action name |
| `entity_type` | VARCHAR(50) | NO | — | NOT NULL | Entity class |
| `entity_id` | UUID | YES | — | — | Entity PK |
| `request_id` | VARCHAR(255) | YES | — | — | Correlation ID |
| `success` | BOOLEAN | NO | `true` | NOT NULL | Outcome |
| `metadata` | JSONB | YES | `'{}'` | — | Extra data |
| `category` | VARCHAR(20) | NO | `'CATEGORY_A'` | — | Audit category (m032) |
| `correlation_id` | VARCHAR(255) | YES | — | — | Trace correlation (m032) |
| `reason` | TEXT | YES | — | — | Change reason (m032) |
| `before_snapshot` | JSONB | YES | — | — | Pre-mutation state (m032) |
| `after_snapshot` | JSONB | YES | — | — | Post-mutation state (m032) |
| `created_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | — | Immutable timestamp |

**Immutability**: Database-level triggers `trg_prevent_audit_logs_update` and `trg_prevent_audit_logs_delete` reject any UPDATE or DELETE attempt.
**No `updated_at`**: Audit records are write-once.
**Indexes**: `idx_audit_logs_org_timestamp`, `idx_audit_logs_org_entity`, `idx_audit_logs_org_user`, `idx_audit_logs_request_id`, `idx_audit_logs_org_cat`, `idx_audit_logs_correlation`, `idx_audit_logs_org_act`

---

## 34. auth_token_revocations

**Purpose**: JWT revocation list for refresh token invalidation.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `jti` | VARCHAR(255) | NO | — | PK | JWT ID (JTI claim) |
| `user_id` | UUID | NO | — | FK → `users(id)` CASCADE | Token owner |
| `expires_at` | TIMESTAMPTZ | NO | — | NOT NULL | Token expiry |
| `revoked_at` | TIMESTAMPTZ | NO | `CURRENT_TIMESTAMP` | NOT NULL | Revocation time |

**Indexes**: `idx_token_revocations_expires_at` (supports cleanup of expired entries)
**Note**: `jti` is the natural PK (no separate `id` column). No `organization_id` — scoped through `user_id`.
