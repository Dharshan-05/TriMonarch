# TriMonarch ERP — Database Migration Strategy

## Migration Overview

Database migrations are managed via sequentially numbered SQL files located in the `migrations/` directory. The custom migrator (`src/database/migrator.ts`) tracks applied migrations in a `schema_migrations` table.

---

## Migration Location

```
migrations/
├── 001_create_extensions_and_helpers.sql
├── 002_create_organizations.sql
├── 003_create_users_and_roles.sql
├── 004_create_departments_and_employees.sql
├── 005_create_products_and_inventory.sql
├── 006_create_customers_and_suppliers.sql
├── 007_add_authentication_fields.sql
├── 008_create_token_revocations.sql
├── 009_create_audit_logs.sql
├── 010_add_product_price_and_cost.sql
├── 011_create_boms.sql
├── 012_create_sales_orders.sql
├── 013_create_purchase_orders.sql
├── 014_create_manufacturing_orders.sql
├── 015_create_stock_ledger.sql
├── 016_create_stock_reservations.sql
├── 017_create_sales_deliveries.sql
├── 018_create_sales_delivery_items.sql
├── 019_add_warehouse_id_and_status_to_purchase_orders.sql
├── 020_create_purchase_receipts.sql
├── 021_create_purchase_receipt_items.sql
├── 022_create_supplier_invoices.sql
├── 023_create_supplier_invoice_items.sql
├── 024_create_supplier_payments.sql
├── 025_extend_boms_for_phase031.sql
├── 026_extend_manufacturing_orders_for_phase033.sql
├── 027_create_manufacturing_order_status_history.sql
├── 028_create_manufacturing_material_consumptions.sql
├── 029_create_manufacturing_productions.sql
├── 030_extend_manufacturing_orders_for_phase037.sql
├── 031_create_manufacturing_reversals.sql
└── 032_extend_audit_for_phase039.sql
```

---

## Migration Naming Convention

```
<NNN>_<description>.sql
```

- `NNN` — Zero-padded 3-digit sequential number (001, 002, ...)
- `<description>` — Lowercase `snake_case` description of the change

---

## Migration Lifecycle

```
Write migration SQL
        ↓
Test locally (npm run db:migrate)
        ↓
Peer review
        ↓
Apply to staging (npm run db:migrate)
        ↓
Integration test pass
        ↓
Apply to production
        ↓
Verify schema_migrations table
```

---

## Migration Commands

| Command | Description |
|---|---|
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:rollback` | Roll back the last applied migration |
| `npm run db:status` | Show applied and pending migrations |

---

## Rollback Strategy

Each migration file should include a `-- Down` section or a paired rollback SQL statement. For destructive changes, the rollback must be tested in staging before production deployment.

> **WARNING**: Dropping columns or tables is destructive and irreversible. Never run destructive migrations without a tested rollback plan and a database backup.

---

## Transactional Migrations

Where possible, migrations wrap DDL statements in explicit transactions. PostgreSQL supports transactional DDL for most operations:

```sql
BEGIN;
  ALTER TABLE products ADD COLUMN new_field TEXT;
  -- verify
COMMIT;
```

---

## Production Migration Safety Rules

1. Never run `DROP TABLE` or `DROP COLUMN` without a backup.
2. Always test migrations on a database snapshot first.
3. Never modify existing column types in a live transaction without a compatibility window.
4. Prefer additive migrations (new columns, new tables) over destructive ones.
5. Column removals must go through a deprecation cycle: add → migrate data → verify → drop.
6. Never modify the `schema_migrations` table manually.

---

## schema_migrations Table

The migrator tracks state in:

```sql
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```
