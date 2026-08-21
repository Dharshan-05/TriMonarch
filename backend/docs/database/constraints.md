# TriMonarch ERP — Database Constraints Reference

## Constraint Categories

### 1. Primary Key Constraints

All tables use a UUID primary key generated via `uuid-ossp`:

```sql
id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY
```

### 2. Foreign Key Constraints

Every relationship between domain tables is enforced by a FK:

| Constraint | Table | Column | References | ON DELETE |
|---|---|---|---|---|
| `fk_users_org` | `users` | `organization_id` | `organizations(id)` | RESTRICT |
| `fk_products_org` | `products` | `organization_id` | `organizations(id)` | RESTRICT |
| `fk_partners_org` | `partners` | `organization_id` | `organizations(id)` | RESTRICT |
| `fk_inventory_product` | `inventory_balances` | `product_id` | `products(id)` | RESTRICT |
| `fk_inventory_warehouse` | `inventory_balances` | `warehouse_id` | `warehouses(id)` | RESTRICT |
| `fk_sales_order_items_order` | `sales_order_items` | `sales_order_id` | `sales_orders(id)` | CASCADE |
| `fk_sales_order_items_product` | `sales_order_items` | `product_id` | `products(id)` | RESTRICT |
| `fk_po_items_order` | `purchase_order_items` | `purchase_order_id` | `purchase_orders(id)` | CASCADE |
| `fk_bom_components_bom` | `bom_components` | `bom_id` | `boms(id)` | CASCADE |
| `fk_bom_components_product` | `bom_components` | `component_product_id` | `products(id)` | RESTRICT |
| `fk_manufacturing_bom` | `manufacturing_orders` | `bom_id` | `boms(id)` | RESTRICT |
| `fk_audit_logs_org` | `audit_logs` | `organization_id` | `organizations(id)` | RESTRICT |
| `fk_token_revocations_user` | `token_revocations` | `user_id` | `users(id)` | CASCADE |

### 3. Unique Constraints

| Table | Unique Constraint | Tenant-Scoped |
|---|---|---|
| `organizations` | `(name)` | No (global) |
| `organizations` | `(slug)` | No (global) |
| `users` | `(organization_id, email)` | Yes |
| `products` | `(organization_id, sku)` | Yes |
| `partners` | `(organization_id, name, type)` | Yes |
| `warehouses` | `(organization_id, code)` | Yes |
| `sales_orders` | `(organization_id, order_number)` | Yes |
| `purchase_orders` | `(organization_id, order_number)` | Yes |
| `boms` | `(organization_id, bom_code)` | Yes |
| `manufacturing_orders` | `(organization_id, order_number)` | Yes |
| `token_revocations` | `(token_hash)` | No (global) |

### 4. NOT NULL Constraints

All primary keys, tenant keys, timestamps, and essential domain fields are `NOT NULL`. Nullable fields are explicitly documented as such in [schema.md](./schema.md).

### 5. Check Constraints

| Table | Column | Check | Purpose |
|---|---|---|---|
| `inventory_balances` | `quantity_on_hand` | `>= 0` | Non-negative inventory |
| `inventory_balances` | `quantity_allocated` | `>= 0` | Non-negative allocations |
| `sales_order_items` | `quantity` | `> 0` | Positive quantity |
| `sales_order_items` | `unit_price` | `>= 0` | Non-negative price |
| `purchase_order_items` | `quantity` | `> 0` | Positive quantity |
| `bom_components` | `quantity` | `> 0` | Positive component qty |

---

## PostgreSQL Error Codes Used by the Backend

| Error Code | Name | Trigger | Backend Handler |
|---|---|---|---|
| `23505` | `unique_violation` | Duplicate unique constraint | → `409 CONFLICT` |
| `23503` | `foreign_key_violation` | Referential integrity failure | → `409 CONFLICT` |
| `23502` | `not_null_violation` | NULL in NOT NULL column | → `400 BAD_REQUEST` |
| `23514` | `check_violation` | Check constraint failure | → `400 BAD_REQUEST` |
| `40001` | `serialization_failure` | Concurrent transaction conflict | → Retry / `409 CONFLICT` |
| `40P01` | `deadlock_detected` | Deadlock between transactions | → `503 SERVICE_UNAVAILABLE` |
| `55P03` | `lock_not_available` | Lock timeout exceeded | → `503 SERVICE_UNAVAILABLE` |

---

## Enum Types

| Enum Type | Values | Used In |
|---|---|---|
| `user_role` | `super_admin, admin, manager, user, auditor` | `users.role` |
| `order_status` | `draft, confirmed, processing, completed, cancelled` | `sales_orders.status` |
| `partner_type` | `customer, supplier, both` | `partners.type` |
| `bom_status` | `draft, active, inactive` | `boms.status` |
| `manufacturing_status` | `planned, in_progress, completed, cancelled` | `manufacturing_orders.status` |
| `stock_movement_type` | `inbound, outbound, adjustment, reservation, release` | `stock_ledger.movement_type` |
