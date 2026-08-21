# TriMonarch ERP — Database Architecture

## Overview

TriMonarch ERP uses **PostgreSQL 16** as its sole relational database engine. The database follows a **single-schema, multi-tenant (row-level isolation)** architecture where all tenant data is co-located in the same schema and isolated via `organization_id` foreign keys enforced at the application and database layers.

---

## PostgreSQL Version

| Attribute | Value |
|-----------|-------|
| Engine | PostgreSQL |
| Target Version | 16 (Docker: `postgres:16-alpine`) |
| Extensions | `uuid-ossp` (UUID generation) |

---

## Database Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Tables | `snake_case`, plural | `sales_orders` |
| Columns | `snake_case` | `organization_id` |
| Primary Keys | `id` (UUID) | `id UUID DEFAULT uuid_generate_v4()` |
| Foreign Keys | `<table_singular>_id` | `organization_id`, `product_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` |
| Indexes | `idx_<table>_<columns>` | `idx_products_organization_id` |
| Enums | `snake_case` custom type | `user_role`, `order_status` |
| Boolean | `is_<adjective>` | `is_active`, `is_deleted` |

---

## Schema Organization

All tables reside in the default `public` PostgreSQL schema. There is no explicit schema separation between ERP domains — isolation is achieved through:

1. `organization_id` foreign keys (row-level tenancy)
2. Application-layer parameterized queries
3. Repository-layer `WHERE organization_id = $1` enforcement

---

## Data Type Conventions

| Concept | PostgreSQL Type | Notes |
|---------|----------------|-------|
| Primary Key | `UUID` | `DEFAULT uuid_generate_v4()` |
| Tenant Key | `UUID` | `REFERENCES organizations(id)` |
| Monetary Values | `NUMERIC(15,2)` | Decimal precision, no floating-point |
| Quantities | `NUMERIC(15,4)` | Inventory precision |
| Timestamps | `TIMESTAMPTZ` | UTC; always stored with timezone |
| Status/Role | Custom ENUM | e.g., `user_role`, `order_status` |
| Text | `VARCHAR(n)` or `TEXT` | Bounded where appropriate |
| Boolean | `BOOLEAN NOT NULL DEFAULT false` | Never nullable booleans |
| JSON Payload | `JSONB` | Business event payloads |

---

## Tenant Isolation Model

Every ERP domain table carries:

```sql
organization_id UUID NOT NULL REFERENCES organizations(id)
```

This ensures:
- All queries must be parameterized with `organization_id`
- No cross-tenant data leakage is possible via SQL alone
- Unique constraints are scoped per-tenant (composite unique with `organization_id`)

See [tenant-isolation.md](./tenant-isolation.md) for complete details.

---

## Audit Strategy

All mutation operations (CREATE, UPDATE, DELETE) produce records in the `audit_logs` table. Audit records are append-only and carry `organization_id` for tenant scoping. See [audit-events.md](./audit-events.md).

---

## UUID Strategy

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- All PKs use:
id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY
```

---

## Soft Delete Strategy

The system does **not** implement soft deletes. Records are physically deleted where applicable. Audit logs provide a persistent change history.

---

## Migration Strategy

Migrations are ordered numeric SQL files under `migrations/`. See [migrations.md](./migrations.md).
