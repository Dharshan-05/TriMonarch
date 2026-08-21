# TriMonarch ERP — Layered Architecture

## Overview

The backend follows a strict **unidirectional layered architecture**. Each layer has clearly defined responsibilities and is forbidden from violating layer boundaries.

```
┌──────────────────────────────────────────────────────┐
│                  HTTP / REST API                     │  ← Accepts requests
├──────────────────────────────────────────────────────┤
│          Middleware (Cross-cutting Concerns)          │  ← Auth, rate limit, logs
├──────────────────────────────────────────────────────┤
│                  Controllers                         │  ← HTTP parsing + dispatch
├──────────────────────────────────────────────────────┤
│              Services (Business Logic)               │  ← Domain rules
├──────────────────────────────────────────────────────┤
│     Policies / State Machines / Calculation Engines  │  ← Authorization + transitions
├──────────────────────────────────────────────────────┤
│             Repositories (Data Access)               │  ← SQL, tenant scoping
├──────────────────────────────────────────────────────┤
│                   PostgreSQL 16                      │  ← Persistence
└──────────────────────────────────────────────────────┘
```

---

## Layer 1 — Middleware

**Responsibility**: Cross-cutting HTTP concerns applied before any domain code.

**Must handle**:
- HTTP method enforcement (`methodGuard`)
- Security headers (`configureSecurityHeaders`)
- CORS enforcement
- Request ID attachment (`requestIdHandler`)
- Request logging (`requestLogger`)
- Rate limiting (`globalRateLimiter`)
- Content-Type enforcement (`contentTypeGuard`)
- Body parsing (`express.json`)
- Idempotency (`idempotencyHandler`)
- JWT authentication (`requireAuth`)
- RBAC authorization (`requirePermission`)
- Zod validation (`zodValidate`)

**Forbidden**:
- Business logic
- Direct database access
- Returning domain data
- Calling repositories

---

## Layer 2 — Controllers

**Responsibility**: Thin HTTP adapter between Express and the service layer.

**Must**:
- Extract validated inputs from `req.body`, `req.query`, `req.params`
- Extract `organizationId` and `userId` from `req.user` (set by middleware)
- Call the appropriate service method
- Serialize the service result into a standardized `ApiResponse` envelope
- Return the appropriate HTTP status code

**Forbidden**:
- Business logic
- Direct database queries
- SQL queries
- Authentication decisions
- Authorization decisions (must use middleware)
- Accessing `pool` or `client`

**Example pattern**:
```typescript
export const create = asyncHandler(async (req, res) => {
  const { organizationId } = req.user!;
  const input = req.validatedBody as CreateProductInput;
  const product = await productService.create(organizationId, input);
  return apiResponse(res, 201, product);
});
```

---

## Layer 3 — Services

**Responsibility**: Business logic, domain rule enforcement, workflow coordination.

**Must**:
- Implement all business rules
- Coordinate multiple repository calls
- Manage transactional workflows (begin/commit/rollback)
- Invoke the Policy Engine for resource-level authorization
- Delegate state transitions to state machine services
- Write audit logs and business events within transactions

**Forbidden**:
- Accessing `req` or `res` from Express
- Returning raw SQL rows (must map to domain types)
- Making HTTP calls
- JWT operations

**Example pattern**:
```typescript
async create(organizationId: string, input: CreateProductInput): Promise<Product> {
  // Business rule enforcement
  // Repository delegation
  // Audit logging
}
```

---

## Layer 4 — Policies

**Responsibility**: Authorization decisions at the resource level.

**Must**:
- Evaluate whether a given user/role can perform an action on a resource
- Return `ALLOW` or `DENY` with a reason

**Forbidden**:
- Database mutations
- HTTP responses
- Business logic
- State mutations

---

## Layer 5 — Repositories

**Responsibility**: All database read and write operations.

**Must**:
- Use parameterized SQL queries only
- Filter all tenant-owned queries with `WHERE organization_id = $1`
- Map database rows to domain types
- Accept a `pool` or `client` (for transactions)

**Forbidden**:
- Business logic
- HTTP/Express imports
- JWT operations
- Authentication/authorization decisions
- Arbitrary SQL string interpolation

**Example pattern**:
```typescript
async findBySku(organizationId: string, sku: string): Promise<Product | null> {
  const result = await this.pool.query(
    'SELECT * FROM products WHERE organization_id = $1 AND sku = $2',
    [organizationId, sku]
  );
  return result.rows[0] ?? null;
}
```

---

## Layer 6 — PostgreSQL

**Responsibility**: Durable persistence, constraint enforcement, transaction management.

- Enforces NOT NULL, FK, unique, and check constraints
- Protects audit logs via immutability triggers
- Manages connection pooling via `pg`
