# ERP Backend Service

Comprehensive Node.js, Express, and PostgreSQL backend service built with TypeScript strict mode, Zod environment validation, Pino structured logging, Vitest test suite, explicit database schema migration foundation, type-safe repository data access layer, production-grade REST API architecture, JWT authentication layer, robust transaction management, durable Audit Logging subsystem, exact Decimal & Financial Precision layer, generic Repository Architecture, UserRepository, Partner Repositories, Product Repository, BOM Repository, Sales Order Repository, Purchase Order Repository, Manufacturing Repository, Stock Ledger Repository, Audit Log Repository, Product Service, Partner Service, Inventory Core Engine (`InventoryService`), Stock Reservation Engine (`StockReservationService`), Stock Adjustment Engine (`StockAdjustmentService`), Inventory Concurrency Control subsystem, Sales Order Service (`SalesOrderService`), Sales Order State Machine (`SalesOrderStateMachineService`), Sales Delivery Engine (`SalesDeliveryService`), Purchase Order Service (`PurchaseOrderService`), and Purchase Receiving Engine (`PurchaseReceiptService` & `PurchaseReceiptStateMachineService`).

## Prerequisites

- **Node.js**: v18+ or v20+
- **npm**: v9+
- **PostgreSQL**: v14+ (running database instance required for PostgreSQL connection)

## Backend Deployment Documentation (`docs/deployment/`)

Phase 079 establishes a production-grade Backend Deployment Documentation Framework:

- **[deployment-overview.md](docs/deployment/deployment-overview.md)**: Deployment architecture, topology, lifecycle flows.
- **[prerequisites.md](docs/deployment/prerequisites.md)**: System requirements, software versions, permissions.
- **[environment-configuration.md](docs/deployment/environment-configuration.md)**: Fail-fast validation, environment variables, safety rules.
- **[docker-deployment.md](docs/deployment/docker-deployment.md)**: Multi-stage Docker build, non-root user execution, optimization.
- **[production-deployment.md](docs/deployment/production-deployment.md)**: Step-by-step production deployment and quality gates.
- **[database-deployment.md](docs/deployment/database-deployment.md)**: PostgreSQL 16 connection pooling, networking, persistent storage.
- **[migration-deployment.md](docs/deployment/migration-deployment.md)**: Production migration execution, backups, rollback guidelines.
- **[ci-cd.md](docs/deployment/ci-cd.md)**: CI/CD pipeline stages, quality gate checklist, failure policies.
- **[health-checks.md](docs/deployment/health-checks.md)**: Liveness (`/health/live`), readiness (`/health/ready`), Docker (`/health`) probes.
- **[observability.md](docs/deployment/observability.md)**: Structured Pino logging, correlation IDs, Prometheus `/metrics`.
- **[security.md](docs/deployment/security.md)**: Non-root runtime, network isolation, TLS, input validation.
- **[secrets-management.md](docs/deployment/secrets-management.md)**: JWT secrets, database passwords, placeholder policy.
- **[backup-and-recovery.md](docs/deployment/backup-and-recovery.md)**: Backup frequency, RPO/RTO targets, restore verification.
- **[rollback.md](docs/deployment/rollback.md)**: Application container rollback and schema rollback strategies.
- **[zero-downtime-deployment.md](docs/deployment/zero-downtime-deployment.md)**: Rolling deployment, readiness gating, connection draining.
- **[scaling.md](docs/deployment/scaling.md)**: Horizontal scaling, stateless design, connection pool capacity.
- **[troubleshooting.md](docs/deployment/troubleshooting.md)**: Symptom-cause-resolution runbooks for deployment issues.
- **[operational-runbook.md](docs/deployment/operational-runbook.md)**: Operational checklists for startup, shutdown, incidents.
- **[disaster-recovery.md](docs/deployment/disaster-recovery.md)**: Disaster restoration procedures and verification.

**Validation**: `npm run test:docs:deployment`

---

## Backend Architecture Documentation (`docs/architecture/`)

Phase 078 establishes a production-grade Backend Architecture Documentation Foundation:

- **[overview.md](docs/architecture/overview.md)**: System architecture diagram, layer responsibilities, architectural principles.
- **[project-structure.md](docs/architecture/project-structure.md)**: Complete annotated `src/` source tree with all 180+ TypeScript files.
- **[request-lifecycle.md](docs/architecture/request-lifecycle.md)**: Full HTTP request lifecycle Mermaid diagram, middleware stack order.
- **[layered-architecture.md](docs/architecture/layered-architecture.md)**: Layer boundaries, what each layer must/must not do.
- **[dependency-rules.md](docs/architecture/dependency-rules.md)**: Allowed dependency graph, prohibited patterns, parameter order conventions.
- **[authentication.md](docs/architecture/authentication.md)**: JWT, bcrypt, token rotation, JTI revocation, auth errors.
- **[authorization.md](docs/architecture/authorization.md)**: RBAC, Policy Engine, permission model, IDOR protection.
- **[multi-tenancy.md](docs/architecture/multi-tenancy.md)**: Row-level tenancy, `organization_id` enforcement, cross-tenant prevention.
- **[domains.md](docs/architecture/domains.md)**: All 14 ERP domains — controllers, services, repositories, DB tables.
- **[state-machines.md](docs/architecture/state-machines.md)**: Sales, Purchase, Manufacturing, BOM, Delivery state machines.
- **[transactions.md](docs/architecture/transactions.md)**: BEGIN/COMMIT/ROLLBACK, isolation levels, row locking, deadlocks.
- **[error-handling.md](docs/architecture/error-handling.md)**: Error class hierarchy, HTTP status mapping, PostgreSQL error codes.
- **[validation.md](docs/architecture/validation.md)**: Zod schema strategy, UUID/decimal/enum/date validation, mass assignment protection.
- **[security.md](docs/architecture/security.md)**: Defense-in-depth model, SQL injection, auth, RBAC, tenant isolation, headers.
- **[observability.md](docs/architecture/observability.md)**: Structured logging, correlation IDs, Prometheus metrics, health checks.
- **[deployment.md](docs/architecture/deployment.md)**: Multi-stage Docker build, Compose, production config, graceful shutdown.
- **[documentation-guide.md](docs/architecture/documentation-guide.md)**: How to add new documentation and validation standards.

**Validation**: `npm run test:docs:architecture`

---

## Database Documentation (`docs/database/`)

Phase 077 establishes a production-grade Database Documentation Foundation:

- **[architecture.md](docs/database/architecture.md)**: PostgreSQL 16 architecture, naming conventions, data types, UUID strategy, tenant model overview.
- **[schema.md](docs/database/schema.md)**: Complete column-by-column table reference for all 34 production tables.
- **[erd.md](docs/database/erd.md)**: Mermaid entity-relationship diagram covering all domain clusters.
- **[relationships.md](docs/database/relationships.md)**: Full 1:N, N:N relationship map, cascade/referential actions.
- **[tenant-isolation.md](docs/database/tenant-isolation.md)**: Multi-tenant row-level isolation model, `organization_id` enforcement.
- **[constraints.md](docs/database/constraints.md)**: FK, unique, check, NOT NULL constraints; PostgreSQL error code mappings.
- **[indexes.md](docs/database/indexes.md)**: Full index inventory with query patterns and tenant relevance.
- **[migrations.md](docs/database/migrations.md)**: 32-migration lifecycle, naming, rollback, production safety rules.
- **[transactions.md](docs/database/transactions.md)**: Transaction boundaries, isolation levels, row locking, deadlock handling.
- **[audit-events.md](docs/database/audit-events.md)**: Append-only audit log and business event data models.
- **[security.md](docs/database/security.md)**: Credential management, network isolation, parameterized queries, backup policy.
- **[development-database.md](docs/database/development-database.md)**: Local dev database setup, seed data, Docker workflow.
- **[testing-database.md](docs/database/testing-database.md)**: Test database strategy across unit/integration/e2e/security layers.

---

## API Documentation (`src/docs/`)

Phase 076 establishes a production-grade OpenAPI 3.1 API Documentation System for the TriMonarch ERP backend:

- **`GET /openapi.json`**: Serves the raw OpenAPI 3.1 JSON specification (machine-readable).
- **`GET /api-docs`**: Interactive Swagger UI explorer backed by the OpenAPI spec.
- **`GET /api/v1/docs`**: Versioned API documentation endpoint returning the OpenAPI document.
- **Zero-secret policy**: Specification contains no JWT secrets, DB credentials, refresh tokens, or internal connection strings.
- **Security Schemes**: `bearerAuth` (JWT Bearer) defined for all protected endpoints.
- **Domain Coverage**: Authentication, Users, Products, Partners, Inventory, Sales Orders, Purchase Orders, BOM, Manufacturing, Audit Logs, Business Events, Operational endpoints.

---

## Health Checks & Observability (`src/health/`, `src/observability/`)

Phase 075 establishes a production-grade Health Checks, Readiness, Liveness, Metrics, Structured Logging, and Observability Foundation for the TriMonarch ERP backend:

- **Health Endpoints**:
  - `GET /health`: Canonical Docker health check (`200 OK`, `status: "healthy"` or `"degraded"`).
  - `GET /health/live`: Process Liveness Probe (`200 OK`, `status: "ok"`). Lightweight, process-only.
  - `GET /health/ready`: Dependency Readiness Probe (`200 OK` when DB connected, `503 Service Unavailable` when DB down).
- **Observability Metrics & Logging**:
  - `GET /metrics`: Exposes Prometheus/OpenMetrics text format HTTP counters and process uptime.
  - `structuredLogger`: Centralized JSON logger with automatic redaction of secrets, JWT tokens, and passwords.
  - `requestLogger`: HTTP request logging middleware capturing correlation `X-Request-ID`, status, and latency.

---

## Production Configuration & Hardening (`src/config/production.ts`)

Phase 074 establishes a production-grade, secure, environment-driven Production Configuration Layer for the TriMonarch ERP backend:

- **Production Validation Rules**: Enforces fail-fast validation when `NODE_ENV === 'production'`. Rejects weak/default secrets, wildcard CORS with credentials, localhost database hosts, and invalid rate limits.
- **Production Configuration Suite (`tests/config/`)**: Tests covering environment schema parsing, secret strength validation, database configuration, JWT parameters, CORS rules, rate limits, and multi-rule production safety guards.

---

## Development Docker Compose (`docker-compose.dev.yml`)

Phase 073 establishes a production-grade Development Docker Compose Environment for the TriMonarch ERP backend:

- **Start Services**: `docker compose -f docker-compose.dev.yml up -d`
- **Check Status**: `docker compose -f docker-compose.dev.yml ps`
- **View Logs**: `docker compose -f docker-compose.dev.yml logs -f`
- **Stop Services**: `docker compose -f docker-compose.dev.yml down`
- **Destructive Cleanup (Erases Database Volume)**: `docker compose -f docker-compose.dev.yml down -v`

---

## Input & Data Integrity Audit (`tests/security/data-integrity/`)

Phase 070 establishes a production-grade Input & Data Integrity Security Audit Framework for the TriMonarch ERP backend:

- **Data Integrity Infrastructure (`tests/security/data-integrity/`)**: `integrityPayloads.ts`, `integrityHelpers.ts` (`validatePositiveNumber`), `integrityAssertions.ts` (`assertNonNegativeBalance`), `integritySourceScanner.ts` (`scanIntegritySourceTree`), and `integrityFixtures.ts` (test fixtures).
- **Data Integrity Security Test Coverage**: Test suites for `Schema Validation Audit` (Zod schema boundary enforcement), `Numeric & Financial Integrity` (decimal arithmetic & finite numeric type checks), `Inventory Data Integrity` (non-negative stock invariant), `Foreign-Key Integrity` (`23503` relational checks), `Unique Constraint Integrity` (`23505` tenant-aware uniqueness), `Mass Assignment Protection`, `Prototype Pollution Defense` (`__proto__` property tampering rejection), `Date Integrity` (`dateFrom > dateTo` detection), `State Machine Integrity` (unauthorized transition rejection), `Tenant Data Integrity` (cross-tenant data write denial), `API Input Boundary`, `Database Constraint Integrity` (safe mapping of PostgreSQL codes), `Audit Data Integrity` (server-controlled immutable fields), `Transaction Integrity` (100% rollback guarantee), and `Source Scanner` (zero unsafe mass assignment findings).

---

## Authorization & RBAC Security Audit (`tests/security/authorization/`)

Phase 069 establishes a production-grade Authorization, RBAC, and Policy Security Audit Framework for the TriMonarch ERP backend:

- **Authorization Infrastructure (`tests/security/authorization/`)**: `authzSecurityPayloads.ts`, `authzSecurityHelpers.ts` (`createPolicyContext`), `authzSecurityAssertions.ts` (`assertDeniedDecision`), `authzSourceScanner.ts` (`scanAuthzSourceTree`), and `authzFixtures.ts` (multi-tenant role & user fixtures).
- **Authorization Security Test Coverage**: Test suites for `RBAC Permission Matrix` (role & permission assignment checks), `Vertical Privilege Escalation` (prevention of low-privilege role escalation), `IDOR / BOLA` (object-level access denial across tenant/resource boundaries), `Tenant Authorization` (strict cross-organization boundaries), `Policy Engine` (deny-by-default for unmapped resources), `Permission Middleware` (`requirePermission`), `Claim Manipulation` (verified token claims), `Client Authorization Bypass` (body payload role field rejection), `Resource Ownership`, `State Transition Authorization` (APPROVE & transition role checks), `Destructive Operations` (DELETE permission checks), `Audit Authorization`, `Admin Privilege`, `Permission Confusion` (wildcard/malformed permission rejection), `Authorization Error Contract` (`403 Forbidden` / `INSUFFICIENT_PERMISSIONS`), and `Source Scanner` (zero hardcoded admin bypasses).

---

## Authentication Security Audit (`tests/security/authentication/`)

Phase 068 establishes a production-grade Authentication Security Audit and Hardening Framework for the TriMonarch ERP backend:

- **Authentication Infrastructure (`tests/security/authentication/`)**: `authSecurityPayloads.ts`, `authSecurityHelpers.ts` (`createValidAuthHeader`), `authSecurityAssertions.ts` (`assertNoCredentialLeakage`), `authSourceScanner.ts` (`scanAuthSourceTree`), and `authFixtures.ts` (multi-tenant test organization/user fixtures).
- **Authentication Security Test Coverage**: Test suites for `Login Security` (credential validation & error sanitization), `Password Security` (Bcrypt hashing & policy checks), `JWT Security` (signature validation & claim checks), `Refresh Token Security` (token type isolation), `Token Revocation` (JTI revocation registry), `Auth Middleware` (`requireAuth`), `Brute-Force & Rate-Limit` (`globalRateLimiter`), `User Enumeration Protection`, `Account Status` (suspended/inactive rejection), `Authentication Bypass`, `Credential Leakage` (DTO/response sanitization), `Tenant Isolation` (claims-based organization context), and `Source Scanner` (zero plaintext password logging/hardcoded secrets).

---

## End-to-End ERP Workflow Testing (`tests/e2e/`)

Phase 066 establishes a production-grade End-to-End ERP Workflow Testing Framework for the TriMonarch ERP backend:

- **E2E Infrastructure (`tests/e2e/`)**: `setup.ts` environment safety guard, `fixtures/` (multi-tenant organizations, users, customers, suppliers, products, warehouses, inventory, BOMs, workflows), and `helpers/` (`apiClient`, `auth`, `assertions`, `database`, `cleanup`, `workflow`).
- **Cross-Domain ERP Journeys**:
  - `workflows/`: Customer → Sales Order, Supplier → PO, Product → BOM → MO, Sales → Manufacturing → Inventory, Procurement → Inventory → Manufacturing, and Complete ERP Order-to-Production.
  - `security/`: JWT authentication workflow, RBAC authorization evaluation, and multi-tenant isolation boundaries.
  - `integrity/`: Financial decimal precision, non-negative inventory rules, transaction rollback on API failure, and immutable audit/business event recording.
  - `api/`: Phase 059 response contract compliance, request correlation tracking, and idempotency protection.

---

## Concurrency Testing Framework (`tests/integration/concurrency/`)

Phase 065 establishes a production-grade Concurrency Testing Framework for the TriMonarch ERP backend:

- **Concurrency Infrastructure (`tests/integration/concurrency/`)**: `concurrencySetup.ts`, `concurrencyFixtures.ts`, `concurrencyHelpers.ts` (`runConcurrentRequests`, `runWithBarrier`), `lockHelpers.ts` (`waitForLock`), and `concurrencyAssertions.ts` (`assertNonNegativeStock`, `assertExactlyOneSuccess`).
- **Domain Concurrency Control**: Concurrent test suites for `Inventory` (stock adjustment atomicity), `Product` (cross-tenant duplicate SKU safety), `Sales Order`, `Purchase Order`, `BOM`, `Manufacturing Order`, `Audit Log` (10 concurrent writes), `Tenant Isolation` (zero cross-tenant leakage), `Deadlock` (`40P01`), `Lock Timeout` (`55P03`), `Connection Pool`, `Isolation Level`, and `Serialization Failure` (`40001`).

---

## Transaction Rollback Testing Framework (`tests/integration/transactions/`)

Phase 064 establishes a production-grade Transaction Rollback Testing Framework for the TriMonarch ERP backend:

- **Transaction Test Infrastructure (`tests/integration/transactions/`)**: `transactionSetup.ts`, `transactionFixtures.ts`, `transactionAssertions.ts`, and `rollbackHelpers.ts` supporting transaction snapshot checks and rollback verification (`expectTransactionRollback`, `runWithRollbackSimulation`).
- **Domain Transaction Boundaries**: Test suites covering `Product`, `Inventory`, `Sales Order`, `Purchase Order`, `BOM`, `Manufacturing Order`, `Audit Log`, and `Business Event` transaction rollback scenarios.
- **Integrity & Concurrency Controls**: Constraint failure rollback mapping (`23505`, `23503`, `23502`, `23514`), PostgreSQL connection cleanup, and row-locking release on simulated rollbacks.

---

## Service Integration Testing Foundation (`tests/integration/services/`)

Phase 063 establishes a production-grade Service Integration Testing Foundation for the TriMonarch ERP backend:

- **Service Integration Suite (`tests/integration/services/`)**: Integration tests validating the real Service → Repository → PostgreSQL pipeline across all 11 major ERP domain services: `AuthService`, `UserService`, `PartnerService`, `ProductService`, `InventoryService`, `SalesOrderService`, `PurchaseOrderService`, `BomService`, `ManufacturingOrderService`, `AuditService`, and `AuthorizationService`.
- **Business Rule Orchestration**: Validates transactional stock movements, decimal financial calculations, state machine transitions, RBAC permissions, and business event emission.
- **Service Tenant Boundaries**: Enforces strict service-layer organization boundaries and multi-tenant resource access controls.

---

## Repository Integration Testing Foundation (`tests/integration/`)

Phase 062 establishes a production-grade Repository Integration Testing Foundation for the TriMonarch ERP backend:

- **Integration Infrastructure (`tests/integration/setup.ts`, `fixtures/`, `helpers/`)**: Safe test database lifecycle verification (`verifyTestDatabaseSafety`), test fixture factories for Organizations, Users, Products, Partners, and transaction wrapper helpers (`runInTestTransaction`).
- **Repository Domain Coverage (`tests/integration/repositories/`)**: Real repository integration tests covering User, Customer/Supplier, Product, Inventory, Sales Order, Purchase Order, BOM, Manufacturing, and Audit Log repositories.
- **Security & Integrity Checks**: Strict tenant isolation (`expectTenantIsolated`), parameterized SQL safety against SQL injection, append-only immutability enforcement for audit logs, and constraint validation.
- **Integration Test Execution**: Dedicated test script `npm run test:integration`.

---

## Unit Testing Foundation (`tests/unit/`)

Phase 061 establishes a production-grade Unit Testing Foundation for the TriMonarch ERP backend:

- **Isolated Unit Testing (`tests/unit/`)**: Unit tests for utilities, schemas, middleware, authorization policies, state machines, error mapping, response serialization, and domain services with mocked repositories.
- **Test Fixtures & Helpers (`tests/unit/fixtures/` and `tests/unit/helpers/`)**: Centralized mock data factories (`createMockUser`, `createMockProduct`, `createMockInventory`, `createMockSalesOrder`, `createMockPurchaseOrder`, `createMockBom`, `createMockManufacturingOrder`) and Express request/response helpers.
- **Coverage Configuration (`vitest.config.ts`)**: Configured Vitest runner supporting isolated unit testing and coverage commands (`npm run test:coverage`).

---

## API Security Hardening Engine (`src/middleware/security.ts`, `methodGuard.ts`, `contentTypeGuard.ts`, `requestLimits.ts`)

Phase 060 establishes a production-grade, centralized API Security Hardening Layer for the TriMonarch ERP backend:

- **Security Headers (`src/middleware/security.ts`)**: Enforces Helmet security headers (CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, COOP, CORP).
- **HTTP Method Restrictions (`src/middleware/methodGuard.ts`)**: Restricts incoming requests to allowed HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`). Rejects unsupported methods (e.g. `TRACE`, `CONNECT`) with HTTP 405 `METHOD_NOT_ALLOWED`.
- **Content-Type Enforcement (`src/middleware/contentTypeGuard.ts`)**: Validates write requests (`POST`, `PATCH`, `PUT`) with payload bodies. Rejects unsupported content types (e.g. `text/html`) with HTTP 415 `UNSUPPORTED_MEDIA_TYPE`.
- **Request Limits & Parameter Pollution Guard (`src/middleware/requestLimits.ts`)**: Protects against HTTP Parameter Pollution (HPP) by rejecting duplicate array parameters for sensitive keys (`page`, `sortBy`, `role`, `status`, `userId`, `organizationId`). Enforces maximum query parameter counts and string lengths (`HTTP_PARAMETER_POLLUTION` / `PAYLOAD_TOO_LARGE`).
- **Prototype Pollution Defense (`src/middleware/validation.ts` & `requestLimits.ts`)**: Scans all incoming request bodies for dangerous prototype keys (`__proto__`, `constructor`, `prototype`).
- **CORS Hardening**: Configurable via `CORS_ORIGIN`, `CORS_ALLOWED_HEADERS`, `CORS_METHODS`, `CORS_CREDENTIALS`.

---

## API Response Standardization Engine (`src/utils/response.ts` & `src/types/apiResponse.ts`)

Phase 059 establishes a production-grade, centralized API Response Standardization Engine for the TriMonarch ERP backend:

- **Centralized Response Serializers (`src/utils/response.ts`)**:
  - `sendSuccess(res, data, meta?)`: Formats standard success responses `{ success: true, data, meta: { requestId, apiVersion: "v1", ...meta } }`.
  - `sendCreated(res, data, location?)`: Returns HTTP 201 Created with optional `Location` header.
  - `sendNoContent(res)`: Returns HTTP 204 No Content.
  - `sendPaginated(res, items, page, pageSize, totalItems)`: Formats standard collection responses with deterministic pagination metadata (`page`, `pageSize`, `totalItems`, `totalPages`, `hasNextPage`, `hasPreviousPage`).
- **DTO & Sensitive Field Sanitization**:
  - Automatically redacts sensitive fields (`password`, `passwordHash`, `accessToken`, `refreshToken`, `secret`, `databasePassword`, `apiKey`) from DTO response objects and nested arrays.
- **TypeScript Response Interfaces (`src/types/apiResponse.ts`)**:
  - Exposes `ApiSuccessResponse<T>`, `ApiPaginatedResponse<T>`, `ApiMeta`, `PaginationMeta`, `ApiResponse<T>`.

---

## Global Error Handling Engine (`src/middleware/errorHandler.ts` & `src/errors/`)

Phase 058 establishes a production-grade, centralized Global Error Handling Engine for the TriMonarch ERP backend:

- **Centralized Mapping (`src/errors/errorMapper.ts`)**:
  - Automatically translates application errors (`AppError`), validation failures (`ZodError`), express body-parser syntax errors, payload limits, JWT token errors, and PostgreSQL error codes (`23505`, `23503`, `23502`, `23514`, `22P02`, `40001`, `40P01`, `08000`, `08003`, `08006`) into standardized application error contracts.
- **Security & Sanitization**:
  - Redacts sensitive request payloads (`password`, `accessToken`, `refreshToken`, `jwt`, `secret`, `authorization`, etc.) from all error log outputs.
  - Suppresses raw SQL statements, PostgreSQL constraint names, environment variables, credentials, and internal stack traces in production responses.
- **Request Correlation**:
  - Integrates `X-Request-ID` correlation ID across log lines and API error responses.
- **Standardized Error Contract**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable safe message",
      "requestId": "uuid"
    }
  }
  ```

---

## Centralized Request Validation Engine (`src/middleware/validation.ts` & `src/schemas/common.schema.ts`)

Phase 057 establishes a production-grade, centralized Request Validation Engine for the TriMonarch ERP backend:

- **Validation Middleware**: `validateRequest({ body, query, params, headers })` validates, normalizes, and constrains input schemas using Zod before requests reach controllers, services, or repositories.
- **Common Schemas (`src/schemas/common.schema.ts`)**:
  - `uuidSchema` & `idParamSchema`: Ensures all route ID parameters are valid UUIDs before hitting PostgreSQL.
  - `paginationQuerySchema`: Normalizes and validates `page` (min 1) and `pageSize` / `limit` (max 100).
  - `dateRangeSchema`: Validates start/end date relationships (`dateFrom` <= `dateTo`).
  - `positiveDecimalSchema` & `nonNegativeDecimalSchema`: Prevents NaN, Infinity, negative stock/price values.
  - `idempotencyHeaderSchema`: Validates 8–128 character idempotency keys.
  - `searchSchema` & `emailSchema`: Trims whitespace and validates format/length.
- **Security Protections**:
  - Rejects unknown strict properties on sensitive schemas.
  - Prototype pollution defense: Scans request bodies for `__proto__`, `constructor`, `prototype` keys and rejects with HTTP 400 `VALIDATION_ERROR`.
  - Consistent error contract (`HTTP 400 Bad Request`, `VALIDATION_ERROR`, field-level details, request ID).

---

## Audit Management REST API (`src/routes/audit.routes.ts` & `src/controllers/audit.controller.ts`)

Phase 056 exposes a production-grade, secure, multi-tenant Audit Management REST API mounted under `/api/v1/audit` (and `/api/v1/audits`):

- **Endpoints & Operations**:
  - `GET /api/v1/audit`: Paginated list of tenant audit records (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `actorUserId`, `action`, `resource`, `resourceId`, `eventType`, `severity`, `dateFrom`, `dateTo`, `ipAddress`). Protected by `audit:read` permission and `AuditPolicy`.
  - `GET /api/v1/audit/:auditId`: Retrieves single audit record by ID with organization boundary enforcement. Protected by `audit:read` permission and `AuditPolicy`.
  - `GET /api/v1/audit/actor/:userId`: Audit history for specified user actor within tenant boundary. Protected by `audit:read`.
  - `GET /api/v1/audit/resource/:resource/:resourceId`: Audit history for specified resource entity (e.g., `products`, `orders`). Protected by `audit:read`.
  - `GET /api/v1/audit/events`: Available audit event types from central event registry. Protected by `audit:read`.
  - `GET /api/v1/audit/stats`: Tenant-scoped audit log statistics and aggregations (`totalEvents`, `eventsByAction`, `eventsByResource`, `eventsByUser`). Protected by `audit:read`.
  - `GET /api/v1/audit/export`: Controlled log export (max limit 10,000, tenant isolated, credential redaction). Emits `AUDIT_EXPORTED`. Protected by `audit:export`.
- **Security & Immutability Safeguards**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Immutability guarantee: `PATCH`, `PUT`, `DELETE` routes are unmounted (returns `404 Not Found` / `403 Forbidden`).
  - Sensitive credential redaction on all metadata snapshots (`password`, `token`, `secret`, `jwt`).

---

## Manufacturing Management REST API (`src/routes/manufacturingOrder.routes.ts` & `src/controllers/manufacturingOrder.controller.ts`)

Phase 055 exposes a production-grade, secure, multi-tenant Manufacturing Management REST API mounted under `/api/v1/manufacturing` (and `/api/v1/manufacturing-orders`):

- **Endpoints & Operations**:
  - `GET /api/v1/manufacturing`: Paginated, filterable, sortable list of tenant manufacturing orders (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `productId`, `bomId`, `warehouseId`, `status`, `priority`). Protected by `manufacturing:read` permission and `ManufacturingOrderPolicy`.
  - `GET /api/v1/manufacturing/:id`: Retrieves manufacturing order details, components, status, and production progress. Protected by `manufacturing:read` permission and `ManufacturingOrderPolicy`.
  - `POST /api/v1/manufacturing`: Creates a manufacturing order header with components calculated via BOM explosion (`product_id`, `bom_id`, `warehouse_id`, `order_number`, `planned_quantity`, `planned_start_date`, `planned_end_date`, `notes`). Validates tenant boundaries, BOM/Product match (`BOM_PRODUCT_MISMATCH`), active BOM status, positive quantities, and emits `MANUFACTURING_ORDER_CREATED`.
  - `PATCH /api/v1/manufacturing/:id`: Safe update of editable fields on draft orders. Emits `MANUFACTURING_ORDER_UPDATED`. Protected by `manufacturing:write` permission and `ManufacturingOrderPolicy`.
  - `DELETE /api/v1/manufacturing/:id`: Deletes draft/cancelled manufacturing order within tenant boundary, emitting `MANUFACTURING_ORDER_DELETED`. Protected by `manufacturing:delete` permission and `ManufacturingOrderPolicy`.
  - `GET /api/v1/manufacturing/:id/materials` & `POST /:id/material-check`: Material requirements, inventory component availability lookup, and non-mutating readiness checks (`available`, `partial`, `shortage`).
  - `POST /api/v1/manufacturing/:id/release`, `/start`, `/cancel`, `/complete`: State machine lifecycle transitions (`draft` → `planned` → `released` → `in_progress` → `completed`), emitting `MANUFACTURING_ORDER_RELEASED`, `MANUFACTURING_STARTED`, `MANUFACTURING_CANCELLED`, `MANUFACTURING_COMPLETED`. Protected by `manufacturing:approve` and `manufacturing:execute` permissions.
  - `POST /api/v1/manufacturing/:id/consume-material` & `POST /:id/report-production`: Transactional material consumption (`FOR UPDATE` stock decrement, stock ledger movement) and finished goods production reporting (`FOR UPDATE` finished goods increment, stock ledger movement). Emits `MANUFACTURING_MATERIAL_CONSUMED` and `MANUFACTURING_PRODUCTION_REPORTED`.
- **Security & Integrity Safeguards**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Negative inventory prevention via transactional atomic row locking (`SELECT ... FOR UPDATE`).
  - Business event logging for all lifecycle transitions and stock movements.

---

## Bill of Materials (BOM) Management REST API (`src/routes/bom.routes.ts` & `src/controllers/bom.controller.ts`)

Phase 054 exposes a production-grade, secure, multi-tenant BOM Management REST API under `/api/v1/boms`:

- **Endpoints & Operations**:
  - `GET /api/v1/boms`: Paginated, filterable, sortable list of tenant BOMs (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `productId`, `status`, `version`, `bomNumber`). Protected by `bom:read` permission and `BomPolicy`.
  - `GET /api/v1/boms/:bomId`: Retrieves single BOM header, components, product metadata, and server-calculated `bom_material_cost`. Protected by `bom:read` permission and `BomPolicy`.
  - `POST /api/v1/boms`: Creates a BOM header with components (`product_id`, `bom_number`, `revision`, `version`, `name`, `effective_from`, `effective_to`, `components`, `notes`). Validates tenant boundaries, positive quantities, scrap percentages, duplicate component checks, recursive circular dependency protection (`BOM_CIRCULAR_DEPENDENCY`), and emits `BOM_CREATED`.
  - `PATCH /api/v1/boms/:bomId`: Performs safe update on BOM header fields. Emits `BOM_UPDATED`. Protected by `bom:write` permission and `BomPolicy`.
  - `DELETE /api/v1/boms/:bomId`: Deletes draft/inactive BOM within tenant boundary, emitting `BOM_DELETED`. Protected by `bom:delete` permission and `BomPolicy`.
  - `POST /api/v1/boms/:bomId/components`, `PATCH /api/v1/boms/:bomId/components/:componentId`, `DELETE /api/v1/boms/:bomId/components/:componentId`: Granular order line component management on draft BOMs with validation and business event logging (`BOM_COMPONENT_ADDED`, `BOM_COMPONENT_UPDATED`, `BOM_COMPONENT_REMOVED`).
  - `POST /api/v1/boms/:bomId/activate`, `/deactivate`, `/archive`, `/revision`, `/default`: Workflow, revision, and status state machine endpoints emitting `BOM_ACTIVATED`, `BOM_DEACTIVATED`, `BOM_VERSION_CREATED`, `BOM_DEFAULT_SET`. Protected by `bom:manage` permission and `BomPolicy`.
- **Security & Recursive Hierarchy Safeguards**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Server-side BFS/DFS recursive graph traversal preventing circular BOM relationships (`A → B → A` or `A → B → C → A`).
  - Material cost aggregation based on component product prices/costs and scrap factors.

---

## Purchase Order Management REST API (`src/routes/purchaseOrder.routes.ts` & `src/controllers/purchaseOrder.controller.ts`)

Phase 053 exposes a production-grade, secure, multi-tenant Purchase Order Management REST API under `/api/v1/purchase-orders`:

- **Endpoints & Operations**:
  - `GET /api/v1/purchase-orders`: Paginated, filterable, sortable list of tenant purchase orders (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `supplierId`, `warehouseId`, `status`, `orderDate`, `expectedDeliveryDate`). Protected by `purchase_order:read` permission and `PurchaseOrderPolicy`.
  - `GET /api/v1/purchase-orders/:purchaseOrderId`: Retrieves purchase order header and line items by ID within authenticated organization context. Protected by `purchase_order:read` permission and `PurchaseOrderPolicy`.
  - `POST /api/v1/purchase-orders`: Creates a purchase order with line items (`supplier_id`, `warehouse_id`, `order_number`, `order_date`, `expected_delivery_date`, `currency`, `items`, `notes`). Validates supplier & product tenant boundaries, calculates exact line item and header totals, throwing HTTP 409 duplicate key error on order number collision, and emits `PURCHASE_ORDER_CREATED`.
  - `PATCH /api/v1/purchase-orders/:purchaseOrderId`: Performs safe partial update on purchase order header fields. Emits `PURCHASE_ORDER_UPDATED` event. Protected by `purchase_order:write` permission and `PurchaseOrderPolicy`.
  - `PATCH /api/v1/purchase-orders/:purchaseOrderId/status`: Transitions purchase order state (`draft` → `submitted` → `approved` → `processing` → `partially_received` → `received` → `completed` / `cancelled`) via `PurchaseOrderStateMachineService`, enforcing state transition rules and emitting state change events (`PURCHASE_ORDER_SUBMITTED`, `PURCHASE_ORDER_APPROVED`, `PURCHASE_ORDER_CANCELLED`, etc.).
  - `DELETE /api/v1/purchase-orders/:purchaseOrderId`: Deletes purchase order within tenant boundary, emitting `PURCHASE_ORDER_DELETED`.
  - `POST /api/v1/purchase-orders/:purchaseOrderId/items`, `PATCH /api/v1/purchase-orders/:purchaseOrderId/items/:itemId`, `DELETE /api/v1/purchase-orders/:purchaseOrderId/items/:itemId`: Granular order line item management on draft purchase orders with automatic header total recalculations.
- **Security & Financial Integrity**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Exact decimal arithmetic for subtotal, discount, tax rate, tax amount, and grand total calculations.

---

## Sales Order Management REST API (`src/routes/salesOrder.routes.ts` & `src/controllers/salesOrder.controller.ts`)

Phase 052 exposes a production-grade, secure, multi-tenant Sales Order Management REST API under `/api/v1/sales-orders`:

- **Endpoints & Operations**:
  - `GET /api/v1/sales-orders`: Paginated, filterable, sortable list of tenant sales orders (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `customerId`, `status`, `orderDate`). Protected by `sales_order:read` permission and `SalesOrderPolicy`.
  - `GET /api/v1/sales-orders/:salesOrderId`: Retrieves sales order header and line items by ID within authenticated organization context. Protected by `sales_order:read` permission and `SalesOrderPolicy`.
  - `POST /api/v1/sales-orders`: Creates a sales order with optional line items (`customer_id`, `order_number`, `order_date`, `currency`, `items`, `notes`). Validates customer & product tenant boundaries, calculates exact line item and header totals, throwing HTTP 409 duplicate key error on order number collision, and emits `SALES_ORDER_CREATED`.
  - `PATCH /api/v1/sales-orders/:salesOrderId`: Performs safe partial update on sales order header fields. Emits `SALES_ORDER_UPDATED` event. Protected by `sales_order:write` permission and `SalesOrderPolicy`.
  - `PATCH /api/v1/sales-orders/:salesOrderId/status`: Transitions sales order state (`draft` → `confirmed` → `processing` → `shipped` → `completed` / `cancelled`) via `SalesOrderStateMachineService`, enforcing state transition rules, line item validation, and emitting state change events (`SALES_ORDER_CONFIRMED`, `SALES_ORDER_CANCELLED`, `SALES_ORDER_COMPLETED`).
  - `DELETE /api/v1/sales-orders/:salesOrderId`: Deletes sales order within tenant boundary, emitting `SALES_ORDER_DELETED`.
  - `POST /api/v1/sales-orders/:salesOrderId/items`, `PATCH /api/v1/sales-orders/:salesOrderId/items/:itemId`, `DELETE /api/v1/sales-orders/:salesOrderId/items/:itemId`: Granular order line item management with automatic header total recalculations.
- **Security & Financial Integrity**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Exact decimal arithmetic for subtotal, discount, tax rate, tax amount, and grand total calculations.

---

## Inventory Management REST API (`src/routes/inventory.routes.ts` & `src/controllers/inventory.controller.ts`)

Phase 051 exposes a production-grade, secure, multi-tenant Inventory Management REST API under `/api/v1/inventory`:

- **Endpoints & Operations**:
  - `GET /api/v1/inventory`: Paginated, filterable, sortable list of tenant inventory items (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `productId`, `warehouseId`, `status`). Protected by `inventory:read` permission and `InventoryPolicy`.
  - `GET /api/v1/inventory/:inventoryId`: Retrieves inventory item details by ID within authenticated organization context. Protected by `inventory:read` permission and `InventoryPolicy`.
  - `GET /api/v1/inventory/:inventoryId/movements`: Retrieves paginated stock movement ledger history for an inventory item. Protected by `inventory:read` permission and `InventoryPolicy`.
  - `POST /api/v1/inventory`: Creates inventory record (`product_id`, `warehouse_id`, `quantity`, `reorder_level`). Validates product & warehouse tenant boundaries, emitting `INVENTORY_CREATED`.
  - `PATCH /api/v1/inventory/:inventoryId`: Performs safe partial update on inventory fields (`quantity`, `reorder_level`). Emits `INVENTORY_UPDATED` event. Protected by `inventory:write` permission and `InventoryPolicy`.
  - `PATCH /api/v1/inventory/:inventoryId/adjust`: Performs atomic stock adjustment with transactional row locking, ledger entry creation, and business event emission (`INVENTORY_ADJUSTED`). Protected by `inventory:adjust` permission and `InventoryPolicy`.
  - `DELETE /api/v1/inventory/:inventoryId`: Deletes inventory record within tenant boundary, emitting `INVENTORY_DELETED`.
- **Security & Concurrency**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Row locking (`FOR UPDATE`) for atomic stock adjustments to prevent race conditions.

---

## Product Management REST API (`src/routes/product.routes.ts` & `src/controllers/product.controller.ts`)

Phase 050 exposes a production-grade, secure, multi-tenant Product Management REST API under `/api/v1/products`:

- **Endpoints & Operations**:
  - `GET /api/v1/products`: Paginated, filterable, sortable list of tenant products (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `category`, `status`). Protected by `product:read` permission and `ProductPolicy`.
  - `GET /api/v1/products/:productId`: Retrieves product details by ID within authenticated organization context. Protected by `product:read` permission and `ProductPolicy`.
  - `POST /api/v1/products`: Creates a product (`sku`, `name`, `description`, `category`, `unit`, `price`, `cost`, `tax_rate`, `status`). Hashes SKU format, checks SKU uniqueness per tenant (throwing HTTP 409 duplicate key error on collision), enforces `organization_id`, and emits `PRODUCT_CREATED` business event.
  - `PATCH /api/v1/products/:productId`: Performs safe partial update on product fields. Emits `PRODUCT_UPDATED` event. Protected by `product:write` permission and `ProductPolicy`.
  - `PATCH /api/v1/products/:productId/status`: Updates product status (`active`, `inactive`, `discontinued`), emitting `PRODUCT_STATUS_CHANGED`.
  - `DELETE /api/v1/products/:productId`: Deletes product record within tenant boundary, emitting `PRODUCT_DELETED`.
- **Security & Tenant Isolation**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).

---

## Partner Management REST API (`src/routes/partner.routes.ts` & `src/controllers/partner.controller.ts`)

Phase 049 exposes a production-grade, secure, multi-tenant Partner Management REST API under `/api/v1/partners`:

- **Endpoints & Operations**:
  - `GET /api/v1/partners`: Paginated, filterable, sortable list of business partners (customers and suppliers) (`type`, `page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `status`). Protected by `partner:read` permission and `PartnerPolicy`.
  - `GET /api/v1/partners/:partnerId`: Retrieves partner details by ID within authenticated organization context. Protected by `partner:read` permission and `PartnerPolicy`.
  - `POST /api/v1/partners`: Creates a business partner (`type`, `name`, `email`, `phone`, `address`, `status`). Enforces tenant `organization_id` isolation and emits audit event.
  - `PATCH /api/v1/partners/:partnerId`: Performs safe partial update on partner fields. Protected by `partner:update` permission and `PartnerPolicy`.
  - `DELETE /api/v1/partners/:partnerId`: Deletes business partner within tenant boundary. Protected by `partner:delete` permission and `PartnerPolicy`.
- **Security & Tenant Isolation**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).

---

## User Management REST API (`src/routes/user.routes.ts` & `src/controllers/user.controller.ts`)

Phase 048 exposes a production-grade, secure, multi-tenant User Management REST API under `/api/v1/users`:

- **Endpoints & Operations**:
  - `GET /api/v1/users`: Paginated, filterable, sortable list of tenant users (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`, `status`). Protected by `user:read` permission and `UserPolicy`.
  - `GET /api/v1/users/:userId`: Retrieves user details by ID within authenticated organization context. Protected by `user:read` permission and `UserPolicy`.
  - `POST /api/v1/users`: Creates a user (`email`, `name`, `password`, `status`, `role`). Hashes password using bcrypt, checks email uniqueness (throwing HTTP 409 `USER_ALREADY_EXISTS` on collision), enforces tenant `organization_id`, assigns initial role if provided (preventing self-escalation), and emits `USER_CREATED` event.
  - `PATCH /api/v1/users/:userId`: Performs safe partial update on user fields (`name`, `phone`). Sensitive fields protected by `UserPolicy`.
  - `PATCH /api/v1/users/:userId/status`: Updates user status (`active`, `inactive`, `suspended`, `pending`), emitting `USER_STATUS_CHANGED`.
  - `GET /api/v1/users/:userId/roles`: Retrieves assigned RBAC roles for user.
  - `DELETE /api/v1/users/:userId`: Soft-deactivates user record (`status = 'inactive'`), emitting `USER_DELETED`.
- **Security & Tenant Isolation**:
  - Strict organization boundary enforcement on all SQL queries (`WHERE id = $1 AND organization_id = $2`).
  - Zero password hash or credential leakage in DTO responses.

---

## Authentication REST API (`src/routes/auth.routes.ts` & `src/controllers/auth.controller.ts`)

Phase 047 exposes a production-grade, secure Authentication REST API under `/api/v1/auth`:

- **Endpoints & Operations**:
  - `POST /api/v1/auth/login`: Authenticates credentials (`email`, `password`), verifies password hash, validates user status (`active`), updates `last_login_at`, emits `LOGIN_SUCCESS`, and returns `{ accessToken, refreshToken, tokenType: 'Bearer', expiresIn, user }`. Protected by strict rate limiter (`authLimiter`).
  - `POST /api/v1/auth/refresh`: Rotates refresh tokens by verifying refresh JWT, checking DB revocation, revoking old JTI, issuing a new token pair, and validating active user status. Protected by strict rate limiter (`authLimiter`).
  - `POST /api/v1/auth/logout`: Revokes the current session's access and refresh tokens, emitting `LOGOUT` business event.
  - `POST /api/v1/auth/logout-all`: Revokes all active refresh tokens for the authenticated user (`ALL_SESSIONS_${userId}`).
  - `GET /api/v1/auth/me`: Authenticated endpoint returning user profile with assigned RBAC roles.
  - `GET /api/v1/auth/status`: Returns current authentication context status (`{ authenticated: boolean, userId?, organizationId? }`).
- **Security & Enumeration Defense**:
  - Generic `INVALID_CREDENTIALS` 401 error response prevents email/user enumeration.
  - Zero credential or token leakage in logs.

---

## REST API Foundation (`src/app.ts` & `/api/v1`)

Phase 046 establishes a production-grade, centralized REST API Foundation for all current and future domain APIs:

- **Centralized API Versioning & Router (`/api/v1`)**:
  - Mounted centrally in `src/app.ts` via `apiV1Routes`.
- **Request Correlation & ID Tracking (`X-Request-ID`)**:
  - Generates `crypto.randomUUID()` or validates client header, attaching `req.id` and propagating `X-Request-ID` in all HTTP responses and log entries.
- **Idempotency Header Foundation (`Idempotency-Key`)**:
  - Validates key lengths (8–128 chars) and attaches `req.idempotencyKey` for mutation safety.
- **Rate Limiting Foundation (`src/middleware/rateLimit.ts`)**:
  - Configurable rate limiting using environment variables (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`), emitting `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and HTTP 429 `TOO_MANY_REQUESTS` on overflow.
- **CORS & Body Size Limits**:
  - Configurable `CORS_ORIGIN` and `BODY_LIMIT` (default `1mb`) with safe malformed JSON handling.
- **Health & Readiness Checks (`src/routes/health.routes.ts`)**:
  - `GET /health`: Liveness endpoint returning `{ success: true, status: 'healthy', timestamp }`.
  - `GET /ready`: Readiness endpoint verifying PostgreSQL database connectivity (`SELECT 1;`) returning `200 OK` or `503 Service Unavailable`.
- **Standardized Response & Error Contracts**:
  - Success: `{ success: true, data: ..., meta: { requestId, ... } }`.
  - Error: `{ success: false, error: { code, message, requestId } }`.

---

## Authorization Policy Engine (`src/services/policyEngine.service.ts` & `src/policies/`)

Phase 045 establishes a production-grade Policy-Based Authorization Engine built on top of JWT authentication and RBAC:

- **Centralized Action & Policy Contracts (`src/types/policy.ts`)**:
  - Actions: `READ`, `CREATE`, `UPDATE`, `DELETE`, `LIST`, `APPROVE`, `REJECT`, `ASSIGN`, `EXPORT`, `MANAGE`.
  - Context (`PolicyContext`): Encapsulates authenticated `userId`, `organizationId`, `roles`, `permissions`, and `requestedFields`.
- **Policy Engine Service (`src/services/policyEngine.service.ts`)**:
  - `evaluate`: Evaluates policies from `PolicyRegistry` with Deny-By-Default fallback for unmapped resources or failed checks.
  - `can`: Returns boolean `allowed`.
  - `assertCan`: Throws HTTP 403 `InsufficientPermissionsError` when denied.
- **Resource-Specific Policies (`src/policies/`)**:
  - `UserPolicy`: Prevents unauthorized updates to sensitive user fields (`role`, `status`, `organization_id`) and protects against privilege escalation.
  - `OrganizationPolicy`: Enforces strict tenant boundaries (`context.organizationId === resource.id`).
  - `EmployeePolicy`: Ownership checks (employees can manage own non-sensitive fields; managers/admins manage organization).
  - `ManufacturingOrderPolicy`: State-aware evaluation (restricts modifications on `completed` or `cancelled` orders).
  - `AuditPolicy`: Enforces strict immutability on audit logs (denies `CREATE`, `UPDATE`, `DELETE`).

---

## Role-Based Access Control Engine (`src/services/authorization.service.ts` & `src/middleware/rbac.ts`)

Phase 044 establishes a production-grade, multi-tenant Role-Based Access Control (RBAC) authorization system:

- **Centralized Role & Permission Architecture (`src/types/rbac.ts`)**:
  - Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`, `AUDITOR`.
  - Granular `resource:action` permissions (`user:read`, `user:create`, `user:update`, `user:delete`, `role:read`, `role:assign`, `organization:manage`, `employee:read`, `department:write`, `product:write`, `inventory:adjust`, `audit:read`, etc.).
  - Centralized `ROLE_PERMISSIONS` mapping.
- **Authorization Service (`src/services/authorization.service.ts`)**:
  - Centralized checks: `hasRole`, `hasAnyRole`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `canAccessOrganization`, and `canAccessResource`.
  - Supports resource ownership evaluation (`authUserId === targetOwnerUserId` or privileged role override).
- **Reusable Authorization Middleware (`src/middleware/rbac.ts`)**:
  - `requireRole(...allowedRoles)`: Enforces allowed roles, returning 403 `INSUFFICIENT_PERMISSIONS` if unauthorized.
  - `requirePermission(...requiredPermissions)`: Enforces granular permissions, returning 403 `INSUFFICIENT_PERMISSIONS` if unauthorized.
- **Privilege Escalation Protection & IDOR Defense**:
  - Non-privileged roles cannot assign `SUPER_ADMIN` or `ADMIN` roles or elevate their own privileges.
  - Strict tenant boundary checking via `organization_id` on all role lookups and assignments.

---

## JWT Authentication Engine (`src/utils/jwt.ts` & `src/services/auth.service.ts`)

Phase 043 establishes a production-grade, secure JWT authentication system with access tokens, refresh tokens, and revocation support:

- **JWT Architecture & Token Claims**:
  - Access Token Payload: `{ sub, organizationId, jti, type: 'access', iss, aud, iat, exp }`.
  - Refresh Token Payload: `{ sub, organizationId, jti, type: 'refresh', iss, aud, iat, exp }`.
  - Strong signing configuration with explicit algorithm (`HS256`), environment-driven secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`), expiration (`15m` / `7d`), issuer (`JWT_ISSUER`), and audience (`JWT_AUDIENCE`).
- **Token Verification & Security Controls**:
  - `verifyAccessToken`: Verifies signature, expiration, issuer, audience, token type (`access`), and revokes check via `auth_token_revocations` table.
  - `verifyRefreshToken`: Verifies signature, expiration, issuer, audience, token type (`refresh`), and revokes check via `auth_token_revocations` table.
- **Refresh Token Rotation & Revocation**:
  - `POST /api/v1/auth/refresh`: Verifies refresh token, revokes the old refresh token JTI, issues a new access token and rotated refresh token, and enforces active user status.
  - `POST /api/v1/auth/logout`: Revokes access token JTI and optional refresh token JTI.
- **Safety Boundaries**:
  - 0 physical inventory, 0 AP/financial, 0 MO state machine mutations.
  - Does NOT implement Phase 044 (RBAC), Phase 045 (Authorization Policies), Phase 047 (Authentication API).

---

## Password Security & Credential Protection Engine (`src/services/password.service.ts`)

Phase 042 establishes production-grade password security, credential protection, and sanitization:

- **Password Hashing & Verification Abstraction**:
  - `PasswordService` wraps secure hashing (`hashPassword`), constant-time verification (`verifyPassword`), and policy validation (`validatePasswordPolicy`).
  - Uses `bcrypt` with appropriate cost factor (`SALT_ROUNDS = 10`), preventing plaintext password storage or manual comparison.
- **Production-Grade Password Policy (`src/schemas/password.schema.ts`)**:
  - Minimum length: 12 characters, maximum length: 128 characters.
  - Rejects empty or whitespace-only passwords.
  - Supports Unicode characters and long passphrases.
- **Password Change & Reset Token Workflows**:
  - `changePassword`: Requires current password verification, enforces `newPassword !== currentPassword`, updates `password_hash`, and emits `PASSWORD_CHANGED` or `PASSWORD_CHANGE_FAILED` business events.
  - `generatePasswordResetToken`: Generates 32-byte cryptographically random tokens, stores SHA-256 token hashes with 1-hour expiration, and emits `PASSWORD_RESET_REQUESTED` events.
  - `confirmPasswordReset`: Confirms token, updates password hash, and emits `PASSWORD_RESET_COMPLETED`.
- **Comprehensive Credential Sanitization**:
  - Zero plaintext passwords, password hashes, or reset tokens in logs, audit records, error messages, or public API models (`password`, `password_hash`, `resetToken` added to `SENSITIVE_KEYS`).
- **Safety Boundaries**:
  - 0 inventory mutations, 0 financial mutations, 0 manufacturing mutations.
  - Does NOT implement Phase 043 (JWT signing redesign/rotation), Phase 044 (RBAC), Phase 045 (Authorization Policies), Phase 047 (Authentication API).

---

## Authentication Foundation (`src/middleware/auth.ts` & `src/types/auth.ts`)

Phase 041 establishes the production-grade authentication foundation for the TriMonarch ERP backend:

- **Authentication Architecture**:
  - `HTTP Request → Authentication Middleware (requireAuth) → AuthContext → User Lookup → Organization Context → AuthService → Audit / Business Event Integration`
- **Server-Derived Auth Context (`AuthContext`)**:
  - Immutable server-side `AuthContext { userId, organizationId, jti }` attached to Express `req.auth`.
  - Identity spoofing protection: Client-supplied request body, query params, or headers (`X-User-ID`, `X-Organization-ID`) are strictly ignored when resolving authenticated identity.
- **User Status Governance**:
  - Validates user state (`ACTIVE` / `active`), rejecting disabled, inactive, or suspended accounts (`UserAuthenticationDisabledError`).
- **Standardized Errors (`src/errors/authentication.errors.ts`)**:
  - `AuthenticationRequiredError` (401), `InvalidAuthenticationError` (401), `UserAuthenticationDisabledError` (401), `AuthenticationContextError` (401).
- **Safety & Phase Boundaries**:
  - 0 inventory mutations, 0 financial mutations, 0 manufacturing mutations.
  - Does NOT implement Phase 042 (password security/hashing improvements), Phase 043 (JWT signing/token rotation), Phase 044 (RBAC), Phase 045 (Authorization Policies), Phase 047 (Authentication API).

---

## Business Event & Audit Integration Engine (`src/services/businessEvent.service.ts`)

`BusinessEventService` provides a production-grade, in-process, synchronous, typed business-event integration layer connecting ERP domain services to the centralized `AuditService`:

- **Synchronous In-Process Architecture**:
  - `HTTP Request → Auth → Organization Context → Business Service → BusinessEventService → AuditService → AuditRepository → PostgreSQL`
  - Zero external message queues, brokers (Kafka/RabbitMQ/Redis Streams), webhooks, or async background consumers.
- **Strongly Typed Event Registry (`src/events/businessEvent.registry.ts`)**:
  - Maps strongly typed event names (`LOGIN_SUCCESS`, `SALES_ORDER_CONFIRMED`, `PURCHASE_RECEIPT_POSTED`, `SUPPLIER_PAYMENT_RECORDED`, `MANUFACTURING_MATERIAL_CONSUMED`, `MANUFACTURING_PRODUCTION_RECORDED`, `MANUFACTURING_CONSUMPTION_REVERSED`, etc.) to `{ action, entityType, category }`.
- **Validation & Security Sanitization**:
  - Zod validation (`emitBusinessEventSchema`).
  - Automatic recursive redaction of sensitive credentials (`password`, `tokens`, `secrets`, `jwt`, `api_keys`).
- **Transaction Atomicity (`client?: PoolClient`)**:
  - Propagates transactional database clients so business mutations and audit records commit or roll back atomically in the same transaction.
- **Safety Boundaries**:
  - 0 direct physical inventory mutations (`inventoryService` remains owner).
  - 0 direct stock ledger mutations.
  - 0 direct financial mutations.

---

## Centralized Audit Service & Audit Governance Engine (`src/audit/audit.service.ts`)

`AuditService` provides production-grade, centralized, multi-tenant, immutable audit governance:

- **Audit Classification Governance**:
  - `CATEGORY_A`: Security-critical / financial / inventory / manufacturing / state-changing actions (`LOGIN`, `AUTH_FAILURE`, `CREATE`, `DELETE`, order/delivery/invoice/payment/production/reversal ops).
  - `CATEGORY_B`: Operational updates (`UPDATE`).
  - `CATEGORY_C`: Low-risk informational reads (`READ`).
- **Immutability Protection**:
  - Hard application-level immutability guards (`update()` and `delete()` throw explicit errors).
  - Database-level PostgreSQL triggers (`prevent_audit_logs_update`, `prevent_audit_logs_delete`) prevent mutation/deletion.
  - Zero application routes exposed for modification or deletion.
- **Tenant & Actor Governance**:
  - Strict tenant isolation (`organization_id = authenticated organization`).
  - Server-side actor context derived from JWT authentication context.
- **Structured Snapshots & Security Sanitization**:
  - Supports `before_snapshot`, `after_snapshot`, and `metadata`.
  - Automatic recursive redaction of sensitive credentials (`password`, `tokens`, `secrets`, `jwt`, `api_keys`).
- **Transaction Atomicity**:
  - Accepts `client?: PoolClient` so Category A business mutations and audit logs commit or roll back together.
- **API Endpoints**:
  - `GET /api/v1/audits` (List audit logs with category, action, entity, actor, and date filters)
  - `GET /api/v1/audits/:id` (Get single audit log entry by ID)
  - `GET /api/v1/audits/entity/:entityType/:entityId` (Get entity audit history)
  - `GET /api/v1/audits/actor/:actorId` (Get actor audit history)

---

## Manufacturing Rollback & Atomicity Engine (`src/services/manufacturingRollback.service.ts`)

`ManufacturingRollbackService` handles production-grade, transactional, append-only reversals and governed cancellation for manufacturing operations:

- **Material Consumption Reversal**:
  - Restores component inventory via `inventoryService.increaseStock` with stock ledger `IN` (`reference_type = 'MANUFACTURING_CONSUMPTION_REVERSAL'`).
  - Decreases `consumed_quantity` on `manufacturing_order_items`.
  - Enforces `reversal_quantity <= consumed_quantity` (`ManufacturingMaterialReversalExceedsConsumedError`).
  - Inserts append-only record into `manufacturing_consumption_reversals`.
- **Finished Goods Production Reversal**:
  - Reduces finished goods inventory via `inventoryService.decreaseStock` with stock ledger `OUT` (`reference_type = 'MANUFACTURING_PRODUCTION_REVERSAL'`).
  - Decreases `produced_quantity` and `completed_quantity` on `manufacturing_orders`.
  - Enforces `reversal_quantity <= produced_quantity` (`ManufacturingProductionReversalExceedsProducedError`).
  - Inserts append-only record into `manufacturing_production_reversals`.
- **Governed MO Cancellation with Automatic Reversal**:
  - Cancelling an `IN_PROGRESS` MO automatically reverses all active component consumptions in a single atomic transaction, restoring physical inventory before transitioning the MO state to `CANCELLED`.
  - Rejects cancellation if finished goods have already been produced (`ManufacturingOrderCancellationWithActiveProductionError`).
- **Idempotency & Auditing**:
  - Unique constraints on reversal numbers (`uq_mo_consumption_reversals_org_ref`, `uq_mo_prod_reversals_org_ref`).
  - Category A audit log events (`MANUFACTURING_MATERIAL_CONSUMPTION_REVERSED`, `MANUFACTURING_PRODUCTION_REVERSED`, `MANUFACTURING_ORDER_CANCELLED_WITH_REVERSAL`).
- **API Endpoints**:
  - `POST /api/v1/manufacturing-orders/:id/reverse-consumption`
  - `GET /api/v1/manufacturing-orders/:id/consumption-reversals`
  - `POST /api/v1/manufacturing-orders/:id/reverse-production`
  - `GET /api/v1/manufacturing-orders/:id/production-reversals`
  - `POST /api/v1/manufacturing-orders/:id/cancel-with-reversal`

---

## Finished Goods Production Engine (`src/services/manufacturingProduction.service.ts`)

`ManufacturingProductionService` records finished-goods production against an `IN_PROGRESS` Manufacturing Order:

- **State Rule**: Production is strictly allowed only when `manufacturing_order.status === 'in_progress'`. Requests for all other states throw `ManufacturingOrderNotInProgressError`.
- **Material Completion Gate**: Verifies that all required component materials are fully consumed using `isMaterialFullyConsumed` before allowing production. Throws `ManufacturingOrderMaterialsNotFullyConsumedError` if component materials are unconsumed.
- **Production Capacity Rule**: Ensures `requested_quantity <= planned_quantity - produced_quantity`. Exceeding remaining production capacity throws `ManufacturingOrderOverProductionError`.
- **Inventory & Stock Ledger Integration**: Increases finished-goods inventory balance via `inventoryService.increaseStock`, creating stock ledger `IN` entries with `reference_type = 'MANUFACTURING_PRODUCTION'`.
- **Cumulative Quantity Tracking**: Updates cumulative `produced_quantity` and `completed_quantity` on `manufacturing_orders`.
- **Governed MO Completion**: Automatically transitions MO from `in_progress` to `completed` via `manufacturingOrderStateMachineService` when cumulative `produced_quantity >= planned_quantity`.
- **Append-Only History & Idempotency**: Records immutable entries in `manufacturing_productions` and enforces `UNIQUE (organization_id, production_number)` (`DuplicateManufacturingProductionError`).
- **Inventory Safety Boundary**: Finished goods physical inventory increase and stock ledger `IN` are ALLOWED. Component inventory decrease, stock adjustment, and reservation mutations are FORBIDDEN in Phase 037.
- **API Endpoints**:
  - `POST /api/v1/manufacturing-orders/:id/produce`
  - `GET /api/v1/manufacturing-orders/:id/productions`
  - `GET /api/v1/manufacturing-orders/:id/production-status`
  - `GET /api/v1/manufacturing-productions/:productionId`

---

## Manufacturing Material Consumption Engine (`src/services/manufacturingMaterialConsumption.service.ts`)

`ManufacturingMaterialConsumptionService` manages the physical consumption of component materials for `IN_PROGRESS` Manufacturing Orders:

- **State Rule**: Material consumption is strictly allowed only when `manufacturing_order.status === 'in_progress'`. Requests for all other states are rejected with `ManufacturingOrderNotInProgressError`.
- **Remaining Quantity Tracking**: Sourced from `manufacturing_order_items`, tracking `remaining_quantity = required_quantity - consumed_quantity`. Consuming beyond remaining requirement throws `ManufacturingMaterialOverConsumptionError`.
- **Inventory & Stock Ledger Integration**: Executes physical inventory reduction via `inventoryService.decreaseStock`, creating stock ledger `OUT` entries with `reference_type = 'MANUFACTURING_CONSUMPTION'`.
- **Atomic Batch Consumption**: Multi-item consumption requests execute inside a single PostgreSQL transaction (`withTransaction`) with row-level locks (`SELECT ... FOR UPDATE` on MO, items, and inventory). Failure of any item rolls back the entire batch.
- **Append-Only Consumption History**: Every consumption creates an immutable record in `manufacturing_material_consumptions`.
- **Idempotency**: Unique constraint on `(organization_id, reference_number)` prevents double-consumption.
- **Material Completion Detection**: Calculates whether all component items are fully consumed (`isMaterialFullyConsumed`).
- **Inventory Safety Boundary**: Physical stock decrease and stock ledger `OUT` are ALLOWED. Finished goods stock increase, stock adjustment, and reservation mutations are FORBIDDEN in Phase 036.
- **API Endpoints**:
  - `POST /api/v1/manufacturing-orders/:id/consume`
  - `GET /api/v1/manufacturing-orders/:id/consumptions`
  - `GET /api/v1/manufacturing-orders/:id/material-consumption`
  - `GET /api/v1/manufacturing-material-consumptions/:consumptionId`

---

## Component Availability & Material Readiness Engine (`src/services/componentAvailability.engine.ts`, `src/services/componentAvailability.service.ts`)

`ComponentAvailabilityEngine` provides deterministic material-readiness calculations for Manufacturing Orders before execution:

- **Available Quantity Formula**:
  ```
  available_quantity = max(0, on_hand_quantity - reserved_quantity)
  shortage_quantity = max(0, required_quantity - available_quantity)
  component_available = available_quantity >= required_quantity
  ```
- **Authoritative Requirement Source**: Required component quantities are sourced directly from `manufacturing_order_items` component snapshots, with requirement rows aggregated by `product_id`.
- **Active Reservation Deduction**: Sourced from `stock_reservations` with status `'active'` and `expires_at > CURRENT_TIMESTAMP`. Inactive, released, consumed, or cancelled reservations do NOT reduce availability.
- **Warehouse & Tenant Isolation**: Strict scoping by `organization_id` and `MO.warehouse_id`. Stock in other warehouses or tenants is never combined.
- **RELEASED ➔ IN_PROGRESS Readiness Guard**: Integrated into `ManufacturingOrderStateMachineService` via `in_progress` guard. If any component is short, the transition is rejected with `ManufacturingOrderComponentShortageError`.
- **Read-Only Safety Boundary**: Calculating availability is 100% read-only (**0** stock mutations, **0** reservation mutations, **0** stock ledger entries).
- **TOCTOU Limitation**: Availability calculations represent a snapshot in time. Stock is reserved/consumed in subsequent Phase 036 workflows.
- **API Endpoints**:
  - `GET /api/v1/manufacturing-orders/:id/component-availability`
  - `GET /api/v1/manufacturing-orders/:id/readiness`

---

## Manufacturing State Machine & Workflow Governance (`src/services/manufacturingOrderStateMachine.service.ts`)

`ManufacturingOrderStateMachineService` governs all valid Manufacturing Order lifecycle state transitions with strict precondition guards, immutable transition history, and concurrency safety:

- **State Transition Graph**:
  - `draft` ➔ `confirmed` | `cancelled`
  - `confirmed` ➔ `planned` | `cancelled`
  - `planned` ➔ `released` | `cancelled`
  - `released` ➔ `in_progress` | `cancelled`
  - `in_progress` ➔ `completed` | `cancelled`
  - `completed` & `cancelled` are **terminal states** (all outgoing transitions rejected with `ManufacturingOrderTerminalStateError`).
- **Transition Precondition Guards (`TransitionGuardRegistry`)**:
  - `confirmed`: Validates non-empty component requirements snapshot (`ManufacturingOrderMissingComponentsError`) and planned quantity > 0.
  - `planned`: Validates schedule inputs and component snapshot.
  - `released`: Hook for Phase 035 Component Availability validation.
  - `in_progress`: Hook for Phase 036 Component Material Consumption.
  - `completed`: Hook for Phase 037 Finished Goods Production.
  - `cancelled`: Rejects cancellation from terminal states (`ManufacturingOrderCancellationNotAllowedError`). Hook for Phase 038 Atomic Rollback.
- **Immutable Status History**: Logs every state transition atomically into `manufacturing_order_status_history` in the same transaction as the status update. Historical records are append-only.
- **API Endpoint**: `GET /api/v1/manufacturing-orders/:id/status-history`.
- **Inventory Safety Boundary**: State transitions in Phase 034 operate strictly as workflow governance events. They **DO NOT** alter physical inventory or write stock ledger entries.
- **Concurrency & Audit**: Enforces `SELECT ... FOR UPDATE` row-level locks to prevent concurrent race conditions, duplicate transitions, or conflicting transitions, with full Category A audit event logging (`MANUFACTURING_ORDER`).

---

## Manufacturing Order Service (`src/services/manufacturingOrder.service.ts`, `src/services/manufacturingOrderStateMachine.service.ts`)

`ManufacturingOrderService` manages manufacturing order creation, component material requirements, and lifecycle state transitions:

- **MO Lifecycle State Machine**:
  - `draft` -> `confirmed` | `cancelled`
  - `confirmed` -> `planned` | `cancelled`
  - `planned` -> `released` | `cancelled`
  - `released` -> `in_progress` | `cancelled`
  - `in_progress` -> `completed` | `cancelled`
  - `completed` (Terminal State)
  - `cancelled` (Terminal State)
- **BOM Explosion Integration**: Creating or editing a DRAFT MO automatically invokes the BOM Explosion Engine (`bomExplosionService.explodeBom`) to recursively calculate and persist exact component material requirements into `manufacturing_order_items`.
- **Active BOM Validation**: Validates that the referenced BOM is active, belongs to the requested finished product, and is within its effective date window.
- **Inventory Safety Boundary**: MO creation, editing, confirmation, planning, release, starting, and completion **DO NOT** alter physical inventory or write stock ledger entries in Phase 033.
- **Tenant Scoping & Concurrency**: Enforces `organization_id` isolation and PostgreSQL row locking (`lockByIdForUpdate`) with Category A audit logging (`MANUFACTURING_ORDER`).

---

## BOM Explosion Engine (`src/services/bomExplosion.service.ts`, `src/services/bomExplosion.engine.ts`)

`BomExplosionService` and `BomExplosionEngine` calculate multi-level component material requirements:

- **Recursive Traversal & Quantity Propagation**: Traverses nested sub-assembly BOMs to calculate total component requirements for a requested finished product quantity.
- **Scrap Calculation**: Incorporates component scrap percentage:
  $$\text{effective\_quantity} = \frac{\text{base\_required\_quantity}}{1 - \frac{\text{scrap\_percentage}}{100}}$$
- **Normalized Component Result**: Aggregates duplicate component occurrences across different levels by `product_id` with exact `QUANTITY_SCALE` decimal precision.
- **Circular Dependency & Depth Protection**: Detects direct and indirect circular references (`BomCircularReferenceError`) and enforces maximum explosion depth limits (`BomExplosionMaxDepthError`, default: 50).
- **Explosion Trace**: Returns hierarchical `path` array (e.g. `["TABLE-001", "LEG-001", "RUBBER-CAP-001"]`) and minimum `level` for every component.
- **Inventory Safety Boundary**: Read/calculation engine **ONLY**. MUST NOT alter inventory, stock reservations, stock ledger, BOMs, orders, or products.
- **Endpoint**: `POST /api/v1/boms/explode` (Optional: `GET /api/v1/boms/:id/explosion`).

---

## BOM Management Engine (`src/services/bom.service.ts`, `src/services/bomStateMachine.service.ts`)

`BomService` establishes the authoritative Bill of Materials master-data subsystem for manufacturing:

- **BOM Lifecycle State Machine**:
  - `draft` -> `active` | `archived`
  - `active` -> `inactive` | `archived`
  - `inactive` -> `active` | `archived`
  - `archived` (Terminal State)
- **Active BOM Immutability & Revisions**: Active BOM component structures are immutable. Creating a revision (`createRevision`) generates a new `draft` BOM, copying components from the original revision.
- **Default BOM Selection**: Supports one default active BOM per `(organization_id, product_id)` enforced via PostgreSQL partial unique index.
- **Validations & Safety**:
  - Self-reference protection (`BomSelfReferenceError`).
  - Quantity validation (`quantity > 0`).
  - Scrap percentage validation (`0 <= scrap_percentage <= 100`).
  - Effective date range validation (`effective_from <= effective_to`).
  - Empty BOM activation blocked (`BomEmptyError`).
- **Inventory Safety Boundary**: BOM master-data operations **DO NOT** touch physical stock or write stock ledger entries.
- **Tenant Scoping & Concurrency**: Enforces strict `organization_id` isolation and PostgreSQL row locking (`lockByIdForUpdate`) with Category A audit logging (`BOM`).

---

## Supplier Invoice & Accounts Payable Engine (`src/services/supplierInvoice.service.ts`, `src/services/supplierPayment.service.ts`)

`PurchaseReceiptService` handles the physical receipt of goods against approved Purchase Orders:

- **Receipt Lifecycle State Machine**:
  - `draft` -> `posted` | `cancelled`
  - `posted` -> `completed`
  - `completed` (Terminal State)
  - `cancelled` (Terminal State)
- **Inventory Integration**: Physical stock is increased **ONLY** when a receipt is posted (`draft` -> `posted`). Draft receipt creation or modifications DO NOT alter inventory.
- **Stock Ledger Integration**: Posting a receipt automatically writes stock ledger entries with `movement_type = 'IN'` and `reference_type = 'PURCHASE_RECEIPT'`.
- **Over-Receiving Protection**: Server calculates `remaining_receivable = ordered - sum(posted_received)` and rejects any receipt quantity exceeding remaining receivable.
- **Double-Post Protection**: Re-posting a posted receipt is blocked (`PurchaseReceiptAlreadyPostedError`) and does not alter stock.
- **Purchase Order Status Synchronization**: Posting a receipt automatically updates Purchase Order status to `partially_received` or `received`.
- **Tenant Scoping & Concurrency**: Enforces `organization_id` isolation and PostgreSQL row locking (`lockByIdForUpdate`) with Category A audit logging (`PURCHASE_RECEIPT`).

---

## Purchase Order Service (`src/services/purchaseOrder.service.ts`, `src/services/purchaseOrderStateMachine.service.ts`)

`PurchaseOrderService` provides a production-grade transactional business workflow layer for managing Purchase Orders and Purchase Order line items.

---

## Sales Delivery Engine (`src/services/salesDelivery.service.ts`, `src/services/salesDeliveryStateMachine.service.ts`)

`SalesDeliveryService` converts confirmed Sales Orders into controlled warehouse deliveries/shipments.

---

## Sales Order State Machine (`src/services/salesOrderStateMachine.service.ts`)

`SalesOrderStateMachineService` governs all valid Sales Order lifecycle transitions.

---

## Sales Order Service (`src/services/salesOrder.service.ts`)

`SalesOrderService` provides a production-grade business layer for Sales Orders and Sales Order Items.

---

## Inventory Concurrency Control (`src/repositories/inventory.repository.ts`, `src/services/*`)

`Phase 024` hardens all inventory, reservation, adjustment, and ledger engines against concurrent execution race conditions.

---

## Stock Adjustment Engine (`src/services/stockAdjustment.service.ts`)

`StockAdjustmentService` provides a production-grade Stock Adjustment Engine.

---

## Stock Reservation Engine (`src/services/stockReservation.service.ts`)

`StockReservationService` provides a production-grade, multi-tenant Stock Reservation Engine.

---

## Inventory Core Engine (`src/services/inventory.service.ts`)

`InventoryService` provides a centralized business layer for inventory quantity operations (`increaseStock`, `decreaseStock`, `adjustStock`).

---

## Partner Service (`src/services/partner.service.ts`)

`PartnerService` provides unified business workflows for both Customers and Suppliers.

---

## Product Service (`src/services/product.service.ts`)

`ProductService` provides transactional business workflows for managing products.

---

## Commands & Testing

- **Development Server**: `npm run dev`
- **TypeScript Typecheck**: `npm run typecheck`
- **Production Build**: `npm run build`
- **Run Tests**: `npm run test`
- **ESLint Linting**: `npm run lint`
- **Prettier Format**: `npm run format`
- **Migrations**: `npm run db:migrate`
- **Seed Data**: `npm run db:seed`
