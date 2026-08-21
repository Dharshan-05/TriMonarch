# TriMonarch ERP — Dependency Rules

## Allowed Dependency Graph

```
Routes
  ↓
Middleware (auth, rbac, validation)
  ↓
Controllers
  ↓
Services
  ↓  ↘
Repositories  Policies / State Machines / Engines
  ↓
PostgreSQL (pg pool)
```

Additionally:

```
Services → BusinessEvent.service
Services → Audit.service
Services → PolicyEngine.service
Services → StateMachine.service(s)
StateMachine → Repositories (for state reads)
Repositories → db/transaction helpers
```

---

## Allowed Dependency Table

| From | To | Allowed |
|------|----|---------|
| Routes | Controllers | ✅ |
| Routes | Middleware | ✅ |
| Middleware | Services (auth only) | ✅ |
| Controllers | Services | ✅ |
| Controllers | Schemas (for type casting) | ✅ |
| Services | Repositories | ✅ |
| Services | PolicyEngine | ✅ |
| Services | State Machines | ✅ |
| Services | BusinessEvent.service | ✅ |
| Services | Audit.service | ✅ |
| Services | Utils (decimal, logger) | ✅ |
| Repositories | Database pool/client | ✅ |
| Repositories | Utils (logger) | ✅ |
| Repositories | Base repository | ✅ |
| PolicyEngine | Repositories (read-only lookups) | ✅ |
| State Machines | Repositories (state reads) | ✅ |
| Utils | Nothing runtime | ✅ |

---

## Prohibited Patterns

| Pattern | Why Prohibited |
|---------|---------------|
| `Controller → pool.query(...)` ❌ | Controllers must not access the database directly |
| `Controller → pool` ❌ | Database is a repository concern |
| `Repository → req / res` ❌ | Repositories are HTTP-unaware |
| `Repository → JWT` ❌ | Auth is a middleware concern |
| `Repository → express` ❌ | Repositories must not import Express |
| `Service → res.json(...)` ❌ | Services must not write HTTP responses |
| `Service → req.headers` ❌ | Services must not access Express request objects |
| `Middleware → SQL` ❌ | Middleware must not run raw SQL |
| `Schema → Database` ❌ | Schemas are pure validation, no DB |
| `Types → Runtime code` ❌ | Type files must not have runtime side effects |
| Circular dependencies ❌ | A → B → A is always prohibited |

---

## Service Parameter Order Convention

All service methods accept `organizationId` as the **first parameter**:

```typescript
// CORRECT
async findAll(organizationId: string, filters: ProductFilters): Promise<Product[]>

// WRONG
async findAll(filters: ProductFilters, organizationId: string): Promise<Product[]>
```

This convention ensures that tenant scoping is never accidentally omitted.

---

## Repository Parameter Order Convention

Repositories follow the same convention — `organizationId` first:

```typescript
// CORRECT
async findById(organizationId: string, id: string): Promise<Product | null>

// WRONG
async findById(id: string, organizationId?: string): Promise<Product | null>
```

---

## Module Import Rules

- `src/config/database.ts` — Only imported by repositories and the migrator
- `src/config/env.ts` — Imported by config and entry points only
- `src/utils/jwt.ts` — Only imported by auth middleware and auth service
- `src/utils/password.ts` — Only imported by auth service and password service
- `src/middleware/auth.ts` — Only used in routes, never in services
