# TriMonarch ERP — Project Structure

## Root Structure

```
backend/
├── src/                        # All application source code
├── tests/                      # All test files (mirrors src/ structure)
├── migrations/                 # PostgreSQL SQL migration files (001–032)
├── docs/                       # Project documentation
├── dist/                       # TypeScript build output (git-ignored)
├── .env                        # Local environment variables (git-ignored)
├── .env.example                # Environment variable template
├── .eslintrc.json              # ESLint configuration
├── .dockerignore               # Docker build ignore rules
├── Dockerfile                  # Multi-stage production Docker image
├── docker-compose.yml          # Development Docker Compose environment
├── docker-compose.prod.yml     # Production Docker Compose override
├── package.json                # NPM scripts and dependencies
├── tsconfig.json               # TypeScript compiler configuration
├── vitest.config.ts            # Vitest test runner configuration
└── README.md                   # Project overview and quick start
```

---

## Source Tree — `src/`

```
src/
├── app.ts                      # Express app factory (middleware + routes)
├── server.ts                   # HTTP server entry point + graceful shutdown
│
├── config/                     # Environment validation and database config
│   ├── database.ts             # PostgreSQL pool configuration
│   ├── env.ts                  # Zod-validated environment schema
│   └── production.ts           # Production-only configuration
│
├── controllers/                # HTTP request handlers (one per domain)
│   ├── auth.controller.ts
│   ├── organization.controller.ts
│   ├── user.controller.ts
│   ├── role.controller.ts
│   ├── department.controller.ts
│   ├── employee.controller.ts
│   ├── customer.controller.ts
│   ├── supplier.controller.ts
│   ├── partner.controller.ts
│   ├── product.controller.ts
│   ├── warehouse.controller.ts
│   ├── inventory.controller.ts
│   ├── salesOrder.controller.ts
│   ├── salesDelivery.controller.ts
│   ├── purchaseOrder.controller.ts
│   ├── purchaseReceipt.controller.ts
│   ├── supplierInvoice.controller.ts
│   ├── supplierPayment.controller.ts
│   ├── accountsPayable.controller.ts
│   ├── bom.controller.ts
│   ├── bomExplosion.controller.ts
│   ├── componentAvailability.controller.ts
│   ├── manufacturingOrder.controller.ts
│   ├── manufacturingMaterialConsumption.controller.ts
│   ├── manufacturingProduction.controller.ts
│   ├── manufacturingRollback.controller.ts
│   └── audit.controller.ts
│
├── services/                   # Business logic layer (one per domain)
│   ├── auth.service.ts
│   ├── authorization.service.ts
│   ├── tokenRevocation.service.ts
│   ├── password.service.ts
│   ├── organization.service.ts
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── department.service.ts
│   ├── employee.service.ts
│   ├── customer.service.ts
│   ├── supplier.service.ts
│   ├── partner.service.ts
│   ├── product.service.ts
│   ├── warehouse.service.ts
│   ├── inventory.service.ts
│   ├── stockAdjustment.service.ts
│   ├── stockReservation.service.ts
│   ├── salesOrder.service.ts
│   ├── salesOrderStateMachine.service.ts
│   ├── salesDelivery.service.ts
│   ├── salesDeliveryStateMachine.service.ts
│   ├── purchaseOrder.service.ts
│   ├── purchaseOrderStateMachine.service.ts
│   ├── purchaseReceipt.service.ts
│   ├── purchaseReceiptStateMachine.service.ts
│   ├── supplierInvoice.service.ts
│   ├── supplierInvoiceStateMachine.service.ts
│   ├── supplierPayment.service.ts
│   ├── accountsPayable.service.ts
│   ├── bom.service.ts
│   ├── bomStateMachine.service.ts
│   ├── bomExplosion.engine.ts
│   ├── bomExplosion.service.ts
│   ├── componentAvailability.engine.ts
│   ├── componentAvailability.service.ts
│   ├── manufacturingOrder.service.ts
│   ├── manufacturingOrderStateMachine.service.ts
│   ├── manufacturingMaterialConsumption.service.ts
│   ├── manufacturingProduction.service.ts
│   ├── manufacturingRollback.service.ts
│   ├── policyEngine.service.ts
│   └── businessEvent.service.ts
│
├── repositories/               # Data access layer (SQL queries)
│   ├── base/
│   │   ├── base.repository.ts  # Generic CRUD base class
│   │   ├── repository.types.ts # Repository interface types
│   │   ├── repository.utils.ts # SQL helpers
│   │   └── pagination.ts       # Cursor/offset pagination helpers
│   ├── organization.repository.ts
│   ├── user.repository.ts
│   ├── role.repository.ts
│   ├── department.repository.ts
│   ├── employee.repository.ts
│   ├── customer.repository.ts
│   ├── supplier.repository.ts
│   ├── product.repository.ts
│   ├── warehouse.repository.ts
│   ├── inventory.repository.ts
│   ├── stockLedger.repository.ts
│   ├── stockReservation.repository.ts
│   ├── salesOrder.repository.ts
│   ├── salesDelivery.repository.ts
│   ├── purchaseOrder.repository.ts
│   ├── purchaseReceipt.repository.ts
│   ├── supplierInvoice.repository.ts
│   ├── supplierPayment.repository.ts
│   ├── bom.repository.ts
│   ├── manufacturing.repository.ts
│   ├── manufacturingMaterialConsumption.repository.ts
│   ├── manufacturingProduction.repository.ts
│   ├── manufacturingRollback.repository.ts
│   ├── audit.repository.ts
│   ├── auditLog.repository.ts
│   └── partner.routes.ts (via partner domain)
│
├── middleware/                 # Express middleware
│   ├── auth.ts                 # JWT authentication middleware (requireAuth)
│   ├── rbac.ts                 # RBAC permission enforcement middleware
│   ├── security.ts             # Security headers (helmet-style)
│   ├── rateLimit.ts            # Global rate limiter
│   ├── requestId.ts            # X-Request-ID correlation
│   ├── requestLogger.ts        # Structured HTTP request logging
│   ├── requestLimits.ts        # Payload size limits
│   ├── contentTypeGuard.ts     # Content-Type enforcement
│   ├── methodGuard.ts          # HTTP method allow-listing
│   ├── validation.ts           # Zod schema middleware factory
│   ├── idempotency.ts          # Idempotency key handling
│   ├── notFound.ts             # 404 handler
│   └── errorHandler.ts         # Centralized error handler
│
├── policies/                   # Authorization policy functions
│   ├── policy.ts               # Policy interface and base types
│   ├── policy.registry.ts      # Policy registration map
│   ├── audit.policy.ts
│   ├── bom.policy.ts
│   ├── employee.policy.ts
│   ├── inventory.policy.ts
│   ├── manufacturingOrder.policy.ts
│   ├── organization.policy.ts
│   ├── partner.policy.ts
│   ├── product.policy.ts
│   ├── purchaseOrder.policy.ts
│   ├── salesOrder.policy.ts
│   └── user.policy.ts
│
├── schemas/                    # Zod validation schemas (one per domain)
│   ├── common.schema.ts        # Shared UUID, pagination, decimal schemas
│   ├── decimal.schema.ts       # Decimal precision validation
│   ├── password.schema.ts      # Password complexity rules
│   ├── auth.schema.ts
│   ├── organization.schema.ts
│   ├── user.schema.ts
│   ├── role.schema.ts
│   ├── department.schema.ts
│   ├── employee.schema.ts
│   ├── customer.schema.ts
│   ├── supplier.schema.ts
│   ├── partner.schema.ts
│   ├── product.schema.ts
│   ├── warehouse.schema.ts
│   ├── inventory.schema.ts
│   ├── stockAdjustment.schema.ts
│   ├── stockReservation.schema.ts
│   ├── salesOrder.schema.ts
│   ├── salesDelivery.schema.ts
│   ├── purchaseOrder.schema.ts
│   ├── purchaseReceipt.schema.ts
│   ├── supplierInvoice.schema.ts
│   ├── supplierPayment.schema.ts
│   ├── bom.schema.ts
│   ├── bomExplosion.schema.ts
│   ├── componentAvailability.schema.ts
│   ├── manufacturing.schema.ts
│   ├── manufacturingOrder.schema.ts
│   ├── manufacturingMaterialConsumption.schema.ts
│   ├── manufacturingProduction.schema.ts
│   ├── manufacturingRollback.schema.ts
│   ├── businessEvent.schema.ts
│   └── audit.schema.ts
│
├── routes/                     # Express router definitions (one per domain)
│   ├── api.v1.routes.ts        # Top-level /api/v1 router aggregator
│   ├── auth.routes.ts
│   ├── organization.routes.ts
│   ├── user.routes.ts
│   ├── role.routes.ts
│   ├── department.routes.ts
│   ├── employee.routes.ts
│   ├── customer.routes.ts
│   ├── supplier.routes.ts
│   ├── partner.routes.ts
│   ├── product.routes.ts
│   ├── warehouse.routes.ts
│   ├── inventory.routes.ts
│   ├── salesOrder.routes.ts
│   ├── salesDelivery.routes.ts
│   ├── purchaseOrder.routes.ts
│   ├── purchaseReceipt.routes.ts
│   ├── supplierInvoice.routes.ts
│   ├── supplierPayment.routes.ts
│   ├── accountsPayable.routes.ts
│   ├── bom.routes.ts
│   ├── bomExplosion.routes.ts
│   ├── componentAvailability.routes.ts
│   ├── manufacturingOrder.routes.ts
│   ├── manufacturingMaterialConsumption.routes.ts
│   ├── manufacturingProduction.routes.ts
│   ├── audit.routes.ts
│   └── health.routes.ts
│
├── types/                      # Shared TypeScript type definitions
│   ├── index.ts                # Re-exports
│   ├── auth.ts                 # JWT payload, authenticated user
│   ├── policy.ts               # Policy context types
│   ├── rbac.ts                 # RBAC role/permission types
│   ├── apiResponse.ts          # API response envelope types
│   ├── api/index.ts            # API-specific types
│   └── database/index.ts       # Database row types
│
├── errors/                     # Error classes and error handling
│   ├── errors.ts               # Application error base classes
│   ├── errorCodes.ts           # Typed error code constants
│   ├── errorMapper.ts          # PostgreSQL error → HTTP error mapper
│   ├── authentication.errors.ts # Auth-specific error classes
│   └── errorHandler.ts         # Express error handler middleware
│
├── utils/                      # Shared utilities
│   ├── asyncHandler.ts         # Express async wrapper (catches promise rejections)
│   ├── decimal.ts              # Decimal arithmetic (NUMERIC precision)
│   ├── jwt.ts                  # JWT sign/verify wrappers
│   ├── logger.ts               # Pino logger singleton
│   ├── password.ts             # bcrypt hash/compare
│   └── response.ts             # Standardized response builders
│
├── audit/                      # Audit subsystem
│   ├── audit.service.ts        # Audit log write service
│   ├── audit.types.ts          # Audit action types
│   └── audit.utils.ts          # Audit helper utilities
│
├── events/                     # Business event subsystem
│   ├── businessEvent.service.ts
│   ├── businessEvent.types.ts
│   └── businessEvent.registry.ts
│
├── health/                     # Health check endpoints
│   ├── index.ts                # /health, /health/live, /health/ready, /ready
│   └── databaseHealth.ts       # PostgreSQL health probe
│
├── observability/              # Metrics and structured logging
│   ├── logger.ts               # StructuredLogger with REDACTED scrubbing
│   └── metrics.ts              # Prometheus /metrics endpoint
│
├── docs/                       # API documentation (OpenAPI 3.1)
│   ├── openapi.ts              # OpenAPI document + Router (/openapi.json, /api-docs)
│   ├── openapiSchemas.ts       # Domain schemas for OpenAPI spec
│   └── openapiRoutes.ts        # OpenAPI path definitions
│
├── db/                         # Database utilities (query helpers)
│   └── query.ts                # SQL query wrappers
│
├── database/                   # Database lifecycle management
│   ├── migrator.ts             # Migration runner
│   └── seed.ts                 # Development seed data
│
└── config/
    ├── database.ts             # pg Pool configuration + closeDatabasePool()
    ├── env.ts                  # Zod environment validation (required on startup)
    └── production.ts           # Production-specific overrides
```

---

## Directory Responsibility Summary

| Directory | Responsibility | Forbidden Dependencies |
|-----------|---------------|----------------------|
| `controllers/` | HTTP parsing, service delegation, response | Direct SQL, business logic |
| `services/` | Business rules, domain coordination | Express `req`/`res`, direct SQL |
| `repositories/` | Parameterized SQL, record mapping | Express, JWT, business logic |
| `middleware/` | Cross-cutting HTTP concerns | Business logic, direct DB |
| `policies/` | Authorization decisions | Express response, SQL |
| `schemas/` | Zod input validation | Database, services |
| `routes/` | Route mounting, middleware wiring | Business logic, SQL |
| `types/` | TypeScript type definitions | Any runtime code |
| `errors/` | Error classes and mapping | Business logic |
| `utils/` | Pure shared utilities | Express, database |
| `health/` | Health probe endpoints | Business logic |
| `observability/` | Logging and metrics | Business logic |
| `docs/` | OpenAPI specification | Business logic |
