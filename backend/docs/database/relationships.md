# TriMonarch ERP — Entity Relationship Documentation

## Domain Relationship Map

```
organizations (1)
    │
    ├── (N) users
    ├── (N) partners          (customers / suppliers / both)
    ├── (N) products
    ├── (N) warehouses
    ├── (N) inventory_balances
    ├── (N) sales_orders
    │       └── (N) sales_order_items
    │       └── (N) sales_deliveries
    │               └── (N) sales_delivery_items
    ├── (N) purchase_orders
    │       └── (N) purchase_order_items
    │       └── (N) purchase_receipts
    │               └── (N) purchase_receipt_items
    │       └── (N) supplier_invoices
    │               └── (N) supplier_invoice_items
    │               └── (N) supplier_payments
    ├── (N) boms
    │       └── (N) bom_components
    ├── (N) manufacturing_orders
    │       └── (N) manufacturing_order_status_history
    │       └── (N) manufacturing_material_consumptions
    │       └── (N) manufacturing_productions
    │       └── (N) manufacturing_reversals
    ├── (N) stock_ledger
    ├── (N) stock_reservations
    ├── (N) audit_logs
    └── (N) business_events (via payload JSON)

products (1)
    ├── (N) inventory_balances
    ├── (N) stock_ledger
    ├── (N) boms                 (finished_product_id)
    ├── (N) bom_components       (component_product_id)
    ├── (N) sales_order_items
    ├── (N) purchase_order_items
    └── (N) manufacturing_orders (product_id)
```

---

## Relationship Types

| Relationship | From | To | Type | Notes |
|---|---|---|---|---|
| Tenant Ownership | organizations | users | 1:N | Every user belongs to one org |
| Tenant Ownership | organizations | products | 1:N | Products scoped to org |
| Tenant Ownership | organizations | partners | 1:N | Customers and suppliers |
| Tenant Ownership | organizations | warehouses | 1:N | Warehouse per org |
| Inventory | products | inventory_balances | 1:N | Per product per warehouse |
| Order Line | sales_orders | sales_order_items | 1:N | Each order has items |
| Order Line | purchase_orders | purchase_order_items | 1:N | Each PO has items |
| BOM Composition | boms | bom_components | 1:N | A BOM has multiple components |
| BOM Product | products | boms | 1:N | A product can have multiple BOMs |
| BOM Component | products | bom_components | 1:N | Products used as components |
| Manufacturing | boms | manufacturing_orders | 1:N | MO references a BOM |
| Status History | manufacturing_orders | manufacturing_order_status_history | 1:N | Tracks status transitions |
| Delivery | sales_orders | sales_deliveries | 1:N | Shipments for an order |
| Receipt | purchase_orders | purchase_receipts | 1:N | Receipts for a PO |
| Invoice | purchase_orders | supplier_invoices | 1:N | Invoices from suppliers |
| Payment | supplier_invoices | supplier_payments | 1:N | Payments against invoices |
| Token Revocation | users | token_revocations | 1:N | Revoked JWT refresh tokens |
| Audit | (any) | audit_logs | N:1 | Append-only audit trail |
| Stock Ledger | (any mutation) | stock_ledger | N:1 | Double-entry stock movements |

---

## Cascade & Referential Actions

| FK Relationship | ON DELETE | Rationale |
|---|---|---|
| `users.organization_id` | RESTRICT | Cannot delete org with active users |
| `products.organization_id` | RESTRICT | Products tied to org |
| `inventory_balances.product_id` | RESTRICT | Inventory references product |
| `sales_order_items.product_id` | RESTRICT | Ordered products must exist |
| `bom_components.component_product_id` | RESTRICT | Components must exist |
| `audit_logs.organization_id` | RESTRICT | Audit history preserved |

All referential actions default to **RESTRICT** to prevent orphan records and protect audit integrity.

---

## Junction Tables

None of the current domains use explicit many-to-many junction tables. Relationships are mediated through order item lines and BOM component lines.
