# TriMonarch ERP — Database Security Practices

## Credential Management

### Environment Variables Only

All database credentials are supplied exclusively through **environment variables**. No credentials appear in source code, migration files, or documentation.

| Environment Variable | Purpose |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `DATABASE_HOST` | PostgreSQL host (alternative config) |
| `DATABASE_PORT` | PostgreSQL port (default: 5432) |
| `DATABASE_NAME` | Database name |
| `DATABASE_USER` | Application database user |
| `DATABASE_PASSWORD` | Application database password |

### Source Control Policy

The following are **never committed**:
- Database passwords
- Connection strings with credentials
- `.env` files with real values
- Private keys or JWT secrets

A `.env.example` file with placeholder values is provided for local setup.

---

## Application Database User

The backend application connects with a **least-privilege** database user:

- Read/write access to ERP tables
- No `CREATE DATABASE` or `DROP DATABASE` permissions
- No superuser rights
- Schema alteration is handled by the migration runner under a separate privileged session

---

## Docker Network Isolation

In the Docker Compose environment:
- PostgreSQL is bound to the internal Docker network only
- Port `5432` is **not** exposed to the host in production configurations
- The backend service reaches PostgreSQL via the service name (`db`) within the `erp-network` bridge

---

## SQL Parameterization

All database queries use **parameterized queries** via the `pg` driver:

```typescript
// CORRECT — Parameterized
await pool.query('SELECT * FROM products WHERE organization_id = $1 AND sku = $2', [orgId, sku]);

// WRONG — String interpolation (never used)
// await pool.query(`SELECT * FROM products WHERE sku = '${sku}'`);
```

This prevents SQL injection across all repositories. See SQL Injection Audit in Phase 067/070.

---

## Connection Security

| Concern | Mitigation |
|---|---|
| Credential exposure | Environment variables only |
| SQL injection | Parameterized queries throughout |
| Network exposure | Internal Docker network (no external bind) |
| Connection pooling | Pool size limited; connections always released |
| Idle connections | Idle timeout configured via environment |
| TLS (production) | `DATABASE_SSL=true` enables SSL mode |

---

## Backup & Restore Considerations

> **Do not document production backup credentials or schedules here.**

General principles:
- PostgreSQL `pg_dump` for logical backups
- Volume snapshots for binary backups
- Backups must be encrypted at rest
- Restore procedures must be tested regularly
- Backup retention policy defined by operational runbook

---

## Audit Log Immutability

The audit log is write-once. Application user permissions are configured to allow only `INSERT` on `audit_logs`, not `UPDATE` or `DELETE`, ensuring tamper-resistant audit history.
