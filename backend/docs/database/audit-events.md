# TriMonarch ERP — Audit Log & Business Event Data Model

## Audit Logs

### Purpose

The `audit_logs` table provides an **immutable, append-only** record of all domain mutations. It enables traceability, compliance reporting, and forensic investigation.

### Table Structure

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | NO | Audit record ID |
| `organization_id` | UUID | NO | Tenant owning this record |
| `user_id` | UUID | YES | Actor (nullable for system events) |
| `action` | VARCHAR | NO | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, etc. |
| `entity_type` | VARCHAR | NO | Table/entity being audited (e.g., `PRODUCT`) |
| `entity_id` | VARCHAR | NO | ID of the affected entity |
| `before_state` | JSONB | YES | Snapshot before mutation |
| `after_state` | JSONB | YES | Snapshot after mutation |
| `ip_address` | VARCHAR | YES | Client IP (if available) |
| `request_id` | VARCHAR | YES | Correlation ID from `X-Request-ID` |
| `metadata` | JSONB | YES | Additional contextual metadata |
| `created_at` | TIMESTAMPTZ | NO | Immutable creation timestamp |

### Append-Only Guarantees

- Audit records are **never updated or deleted**
- No `updated_at` column exists on `audit_logs`
- Repository enforces INSERT-only operations
- Database-level: no UPDATE/DELETE grants required for the audit write path

### Tenant Scoping

`organization_id` ensures audit queries are always scoped to the requesting tenant. Cross-tenant audit access is prevented at the repository and controller layers.

---

## Business Events

### Purpose

Business events provide a domain event log for integration, replay, and observability. They capture significant state transitions in the ERP system.

### Table Structure

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | NO | Event ID |
| `organization_id` | UUID | NO | Tenant owning this event |
| `event_type` | VARCHAR | NO | Event name (e.g., `SALES_ORDER_CONFIRMED`) |
| `aggregate_type` | VARCHAR | NO | Domain entity type (e.g., `SALES_ORDER`) |
| `aggregate_id` | UUID | NO | ID of the domain entity |
| `payload` | JSONB | NO | Event-specific data |
| `version` | INTEGER | NO | Event schema version |
| `request_id` | VARCHAR | YES | Correlation ID |
| `user_id` | UUID | YES | Triggering user |
| `created_at` | TIMESTAMPTZ | NO | Event timestamp |

### Transactional Guarantee

Business events are written **in the same transaction** as the domain mutation that triggered them. This guarantees:
- No ghost events for failed operations
- No missing events for successful operations
- Consistent `aggregate_id` and `event_type` pairing

### Event Types

| Event Type | Trigger |
|---|---|
| `SALES_ORDER_CONFIRMED` | Sales order status → confirmed |
| `PURCHASE_ORDER_SUBMITTED` | PO status → submitted |
| `INVENTORY_ADJUSTED` | Stock balance modified |
| `MANUFACTURING_ORDER_COMPLETED` | MO status → completed |
| `PRODUCT_CREATED` | New product created |
| `USER_CREATED` | New user created |

---

## Audit API Endpoints (Phase 039)

| Endpoint | Description |
|---|---|
| `GET /api/v1/audits` | List all org audit events (paginated) |
| `GET /api/v1/audits/entity/:type/:id` | Audit history for a specific entity |
| `GET /api/v1/audits/actor/:userId` | All audit events by a specific user |
