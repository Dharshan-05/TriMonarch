# TriMonarch ERP — Test Database Strategy

## Overview

The TriMonarch ERP backend uses multiple testing layers, each with its own database strategy. This document describes how each testing layer interacts with the database.

---

## Test Database Separation

| Layer | Database | Migrations | Seed | Cleanup |
|-------|---------|-----------|------|---------|
| Unit Tests | None (mocked) | No | No | N/A |
| Integration Tests | `erp_test` (local PG) | Yes | Fixtures | After each test |
| E2E Tests | `erp_test` (local PG) | Yes | Fixtures | After each suite |
| Security Tests | `erp_test` (local PG) | Yes | Fixtures | After each test |
| Docker Tests | Static file analysis | No | No | N/A |
| Documentation Tests | File system only | No | No | N/A |

---

## Unit Tests

Unit tests mock all database interactions via `vi.mock()` or manual stubs. No real database connection is required.

```typescript
vi.mock('../../src/config/database', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));
```

---

## Integration Tests

Integration tests connect to a real PostgreSQL instance using:

```dotenv
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_test
```

Each test file:
1. Creates necessary fixture records in `beforeEach`
2. Cleans up created records in `afterEach`
3. Uses unique identifiers (UUIDs, timestamps) to avoid collision

The test database (`erp_test`) must be created before running integration tests:

```bash
createdb erp_test
npm run db:migrate   # applies migrations to erp_test
```

---

## E2E Tests

End-to-end tests cover complete API workflows. They:
1. Initialize the full Express `app` with database connections
2. Create organizations, users, and domain records as fixtures
3. Make real HTTP requests via `supertest`
4. Clean up in `afterEach`/`afterAll`

---

## Test Isolation Guarantees

| Guarantee | Implementation |
|-----------|---------------|
| No cross-test data leakage | Unique UUIDs per test run |
| No cross-tenant leakage | `organization_id` scoping verified in tests |
| No audit log conflict | Audit logs use auto-generated UUIDs |
| No duplicate SKUs/emails | UUIDs embedded in generated test values |

---

## Test Database Safety Rules

1. **Never run tests against a production database**.
2. The `NODE_ENV=test` environment variable disables production-only safeguards.
3. Test fixtures use clearly non-production values (e.g., `test-org-...`, `test-user-...`).
4. Real bcrypt password hashing is used in security tests but with controlled test credentials.

---

## PostgreSQL Docker Initialization

When using Docker Compose (Phase 073), the PostgreSQL container supports automatic database initialization via `docker-entrypoint-initdb.d/`. Initialization scripts create both `erp_db` (production) and `erp_test` databases if configured.

---

## Vitest Database Configuration

Vitest runs tests with `poolOptions.threads` or `forks` isolation. Each test file gets its own module scope, preventing state leakage between test files.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30000,
  }
});
```

---

## Cleanup Strategy

Integration and E2E tests follow this cleanup pattern:

```typescript
afterEach(async () => {
  // Delete in reverse FK order
  await pool.query('DELETE FROM sales_order_items WHERE organization_id = $1', [testOrgId]);
  await pool.query('DELETE FROM sales_orders WHERE organization_id = $1', [testOrgId]);
  await pool.query('DELETE FROM users WHERE organization_id = $1', [testOrgId]);
  await pool.query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
});
```
