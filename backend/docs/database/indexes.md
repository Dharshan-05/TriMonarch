# TriMonarch ERP — Database Index Inventory

## Index Strategy

All indexes follow the naming convention: `idx_<table>_<columns>`

Tenant-scoped indexes include `organization_id` as the leading column to support partition pruning and efficient per-tenant filtering.

---

## Core Domain Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_users_org` | `users` | `(organization_id)` | No | Yes | List users by org |
| `idx_users_email` | `users` | `(organization_id, email)` | Yes | Yes | Login lookup |
| `idx_users_role` | `users` | `(organization_id, role)` | No | Yes | Role-based filtering |
| `idx_products_org` | `products` | `(organization_id)` | No | Yes | List products by org |
| `idx_products_sku` | `products` | `(organization_id, sku)` | Yes | Yes | SKU lookup |
| `idx_products_active` | `products` | `(organization_id, is_active)` | No | Yes | Active product filter |
| `idx_partners_org` | `partners` | `(organization_id)` | No | Yes | Partner list |
| `idx_partners_type` | `partners` | `(organization_id, type)` | No | Yes | Customer/supplier filter |
| `idx_warehouses_org` | `warehouses` | `(organization_id)` | No | Yes | Warehouse list |

---

## Inventory Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_inventory_org` | `inventory_balances` | `(organization_id)` | No | Yes | Org inventory list |
| `idx_inventory_org_product` | `inventory_balances` | `(organization_id, product_id)` | No | Yes | Stock by product |
| `idx_inventory_org_warehouse` | `inventory_balances` | `(organization_id, warehouse_id)` | No | Yes | Stock by warehouse |
| `idx_stock_ledger_org` | `stock_ledger` | `(organization_id)` | No | Yes | Ledger history |
| `idx_stock_ledger_product` | `stock_ledger` | `(organization_id, product_id)` | No | Yes | Product movements |

---

## Sales Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_sales_orders_org` | `sales_orders` | `(organization_id)` | No | Yes | Order list |
| `idx_sales_orders_number` | `sales_orders` | `(organization_id, order_number)` | Yes | Yes | Order lookup |
| `idx_sales_orders_status` | `sales_orders` | `(organization_id, status)` | No | Yes | Status filter |
| `idx_sales_orders_customer` | `sales_orders` | `(organization_id, customer_id)` | No | Yes | Customer orders |
| `idx_sales_order_items_order` | `sales_order_items` | `(sales_order_id)` | No | No | Items for order |

---

## Procurement Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_purchase_orders_org` | `purchase_orders` | `(organization_id)` | No | Yes | PO list |
| `idx_purchase_orders_number` | `purchase_orders` | `(organization_id, order_number)` | Yes | Yes | PO lookup |
| `idx_purchase_orders_status` | `purchase_orders` | `(organization_id, status)` | No | Yes | Status filter |

---

## Manufacturing Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_boms_org` | `boms` | `(organization_id)` | No | Yes | BOM list |
| `idx_boms_code` | `boms` | `(organization_id, bom_code)` | Yes | Yes | BOM lookup |
| `idx_manufacturing_org` | `manufacturing_orders` | `(organization_id)` | No | Yes | MO list |
| `idx_manufacturing_number` | `manufacturing_orders` | `(organization_id, order_number)` | Yes | Yes | MO lookup |
| `idx_manufacturing_status` | `manufacturing_orders` | `(organization_id, status)` | No | Yes | Status filter |

---

## Security & Audit Indexes

| Index Name | Table | Columns | Unique | Tenant | Query Pattern |
|---|---|---|---|---|---|
| `idx_audit_logs_org` | `audit_logs` | `(organization_id)` | No | Yes | Org audit trail |
| `idx_audit_logs_entity` | `audit_logs` | `(organization_id, entity_type, entity_id)` | No | Yes | Entity history |
| `idx_audit_logs_user` | `audit_logs` | `(organization_id, user_id)` | No | Yes | Actor history |
| `idx_audit_logs_created` | `audit_logs` | `(organization_id, created_at DESC)` | No | Yes | Pagination |
| `idx_token_revocations_hash` | `token_revocations` | `(token_hash)` | Yes | No | Token lookup |
| `idx_token_revocations_user` | `token_revocations` | `(user_id)` | No | No | User token list |
