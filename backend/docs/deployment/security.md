# TriMonarch ERP — Deployment Security

## Security Controls Overview

- **Non-Root Execution**: Container process executes as unprivileged user (`node` / `erp` UID 1000).
- **Network Isolation**: PostgreSQL is restricted to private VPC / internal Docker network interfaces only.
- **TLS/SSL Encryption**: In-transit encryption across all external HTTP endpoints and database connections.
- **Fail-Fast Configuration Validation**: Strict validation prevents process execution with insecure default settings or short secrets (`src/config/production.ts`).
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options enforced via middleware (`src/middleware/security.ts`).
- **Rate Limiting**: Global and endpoint-specific rate limiting (`src/middleware/rateLimit.ts`).
- **Tenant Isolation**: Every database query is parameterized and constrained by `organization_id`.
