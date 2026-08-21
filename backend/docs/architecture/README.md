# TriMonarch ERP — Backend Architecture Documentation

## Documentation Index

This directory contains the complete backend architecture reference for the TriMonarch ERP system.

| Document | Purpose |
|----------|---------|
| [overview.md](./overview.md) | Overall system architecture, layers, and principles |
| [project-structure.md](./project-structure.md) | Source tree, directory responsibilities, extension strategy |
| [request-lifecycle.md](./request-lifecycle.md) | Complete HTTP request lifecycle from ingress to response |
| [layered-architecture.md](./layered-architecture.md) | Layer responsibilities and boundaries |
| [dependency-rules.md](./dependency-rules.md) | Allowed and prohibited dependency directions |
| [authentication.md](./authentication.md) | JWT, bcrypt, token lifecycle, token revocation |
| [authorization.md](./authorization.md) | RBAC, Policy Engine, permission model |
| [multi-tenancy.md](./multi-tenancy.md) | Organization isolation, `organization_id` enforcement |
| [domains.md](./domains.md) | All ERP domain modules and their architecture |
| [state-machines.md](./state-machines.md) | Stateful workflow lifecycles (sales, purchase, manufacturing) |
| [transactions.md](./transactions.md) | Transaction ownership, isolation levels, locking |
| [error-handling.md](./error-handling.md) | Centralized error model, HTTP status mapping |
| [validation.md](./validation.md) | Zod schema strategy, request validation pipeline |
| [security.md](./security.md) | Comprehensive backend security architecture |
| [observability.md](./observability.md) | Logging, metrics, health checks, correlation IDs |
| [deployment.md](./deployment.md) | Docker, multi-stage build, Compose, production config |
| [documentation-guide.md](./documentation-guide.md) | How documentation is organized and where to add new docs |

---

## Quick Reference

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Raw SQL via `pg` driver |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Logging | Pino (structured JSON) |
| Testing | Vitest + Supertest |
| Containerization | Docker (multi-stage) + Docker Compose |

### Architectural Principles

1. **Layered architecture** — strict unidirectional dependency flow
2. **Tenant isolation by default** — every query scoped by `organization_id`
3. **Security by design** — auth/authz at middleware layer, not ad-hoc
4. **Parameterized SQL only** — no string interpolation in queries
5. **Explicit transactions** — all multi-step mutations wrapped in `BEGIN/COMMIT`
6. **Append-only audit** — every mutation creates a tamper-proof audit record
7. **Zod validation at the boundary** — all external input validated before processing
8. **Structured observability** — every request logged, correlated, and metered
