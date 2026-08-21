# TriMonarch ERP — Multi-Tenant Database Isolation Model

## Isolation Strategy: Row-Level Tenancy

TriMonarch ERP uses **row-level multi-tenancy** with a shared schema. Every tenant (organization) shares the same set of tables. Data isolation is enforced by:

1. **`organization_id` column** on every ERP domain table
2. **Foreign key** to `organizations(id)` on every domain table
3. **Application-layer enforcement** — every repository query includes `WHERE organization_id = $1`
4. **Composite unique constraints** scoped to `(organization_id, <unique_field>)`

---

## Tenant Column Requirements

Every domain table MUST carry:

```sql
organization_id UUID NOT NULL REFERENCES organizations(id)
```

---

## Tables with Tenant Ownership

| Table | Tenant Column | Notes |
|---|---|---|
| `users` | `organization_id` | Users belong to one org |
| `partners` | `organization_id` | Customers / suppliers scoped |
| `products` | `organization_id` | Product catalog scoped |
| `warehouses` | `organization_id` | Warehouses scoped |
| `inventory_balances` | `organization_id` | Inventory per org |
| `stock_ledger` | `organization_id` | Stock movements per org |
| `stock_reservations` | `organization_id` | Reservations per org |
| `sales_orders` | `organization_id` | Orders per org |
| `sales_order_items` | (inherits via SO) | Via sales_orders |
| `purchase_orders` | `organization_id` | POs per org |
| `purchase_order_items` | (inherits via PO) | Via purchase_orders |
| `boms` | `organization_id` | BOM catalog per org |
| `bom_components` | (inherits via BOM) | Via boms |
| `manufacturing_orders` | `organization_id` | MOs per org |
| `audit_logs` | `organization_id` | Audit history per org |
| `business_events` | `organization_id` | Events per org |

---

## Tables Without Direct Tenant Ownership

| Table | Reason |
|---|---|
| `organizations` | IS the tenant; no self-reference needed |
| `token_revocations` | Scoped by `user_id` which implies tenant |
| `schema_migrations` | System table, no tenant data |

---

## Composite Unique Constraints (Tenant-Scoped Uniqueness)

| Table | Constraint | Purpose |
|---|---|---|
| `users` | `(organization_id, email)` | Email unique per org |
| `products` | `(organization_id, sku)` | SKU unique per org |
| `partners` | `(organization_id, name, type)` | Partner unique per org |
| `warehouses` | `(organization_id, code)` | Warehouse code unique per org |
| `sales_orders` | `(organization_id, order_number)` | Order number unique per org |
| `purchase_orders` | `(organization_id, order_number)` | PO number unique per org |
| `boms` | `(organization_id, bom_code)` | BOM code unique per org |
| `manufacturing_orders` | `(organization_id, order_number)` | MO number unique per org |

---

## Application-Layer Enforcement

Every repository method enforcing tenant isolation follows the pattern:

```typescript
// Service layer always passes organizationId first
const products = await productRepo.findAll(organizationId, filters);

// Repository layer always parameterizes organization boundary
const result = await query(
  'SELECT * FROM products WHERE organization_id = $1 ...',
  [organizationId, ...]
);
```

---

## Cross-Tenant Access Prevention

- JWT payload contains `organizationId` extracted at authentication
- The `requireAuth` middleware injects `req.user.organizationId`
- Every controller extracts `organizationId` from `req.user` — **never from request parameters**
- Query parameters supplying `organizationId` that differ from the JWT claim are rejected with `400 BAD_REQUEST`

---

## Tenant-Aware Indexes

All high-frequency query indexes include `organization_id` as the leading column:

```sql
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_inventory_org_product ON inventory_balances(organization_id, product_id);
```

See [indexes.md](./indexes.md) for the complete index inventory.
