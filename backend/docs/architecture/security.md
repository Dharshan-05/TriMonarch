# TriMonarch ERP — Security Architecture

## Defense-in-Depth Model

```
Internet
   ↓
Rate Limiter          ← DDoS / brute-force prevention
   ↓
Security Headers      ← HSTS, CSP, X-Frame-Options
   ↓
CORS                  ← Origin allow-list enforcement
   ↓
Method Guard          ← Block TRACE, CONNECT, etc.
   ↓
Content-Type Guard    ← Enforce application/json
   ↓
Payload Size Limit    ← Prevent oversized body attacks
   ↓
JWT Authentication    ← Verify identity
   ↓
RBAC Authorization    ← Permission enforcement
   ↓
Zod Validation        ← Input sanitization and type safety
   ↓
Policy Engine         ← Resource-level access decisions
   ↓
Parameterized SQL     ← SQL injection prevention
   ↓
Tenant Isolation      ← Cross-tenant boundary enforcement
   ↓
Audit Logging         ← Tamper-proof mutation records
```

---

## SQL Injection Prevention

All database queries use the `pg` driver's parameterized query interface:

```typescript
// CORRECT — fully safe
await pool.query('SELECT * FROM products WHERE organization_id = $1', [orgId]);

// WRONG — never used
// await pool.query(`SELECT * FROM products WHERE id = '${id}'`);
```

This was verified by the SQL Injection Audit (Phase 067) and confirmed by the security scanner in `tests/security/sql-injection/`.

---

## Authentication Security

- Passwords hashed with **bcrypt cost factor 12**
- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days**
- Token revocation uses a **database JTI blocklist**
- Failed login attempts trigger rate limiting

---

## Authorization Security (RBAC)

- Roles are resolved from the JWT claim (not from request parameters)
- RBAC permission table is defined server-side (not client-influenced)
- Policy Engine validates resource ownership before any mutation
- No permission bypass through parameter manipulation

---

## Tenant Isolation

- `organization_id` is extracted from the JWT, **never from request body or query**
- All repository queries include `WHERE organization_id = $1`
- Composite unique constraints prevent cross-tenant collisions
- Cross-tenant override attempts return `400 BAD_REQUEST`

---

## Input Validation & Data Integrity

- Zod schemas strip unknown fields (`mass assignment protection`)
- All numeric fields validated for non-negative, finite values
- UUID format validated on all path parameters
- Enum values validated against allowed lists
- String lengths bounded by schema constraints

---

## Rate Limiting

- Global rate limiter: **100 requests/minute per IP** (configurable)
- Auth endpoints have a stricter limit: **10 requests/minute per IP**
- Exceeding limits returns `429 Too Many Requests`

---

## Security Headers

Applied via `configureSecurityHeaders` middleware:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Content-Security-Policy` | `default-src 'self'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera/microphone/geolocation disabled |

---

## Error Sanitization

- Stack traces are **never** included in production API responses
- PostgreSQL error internals are sanitized before response
- Internal IP addresses and file paths are not exposed
- Only typed error codes and safe messages are returned

---

## Audit Logging

- Every mutation creates an immutable `audit_logs` record
- Database triggers prevent UPDATE or DELETE on audit records
- Audit records include `before_snapshot` and `after_snapshot` (JSONB)
- Audit queries are always tenant-scoped

---

## Credential Protection

- No passwords, JWT secrets, or connection strings in source code
- Environment variables used exclusively for credentials
- `.env` files are git-ignored
- Production secrets managed via external secret injection

---

## Docker Security

- Non-root runtime user (`node`, UID 1000) in production image
- Multi-stage build removes dev dependencies from final image
- PostgreSQL port not bound to host in production
- Health check endpoint accessible without credentials

---

## Security Audit Coverage

| Audit Phase | Coverage |
|-------------|---------|
| Phase 067 | SQL Injection |
| Phase 068 | Authentication Security |
| Phase 069 | Authorization/RBAC |
| Phase 070 | Input & Data Integrity |
| Phase 071 | Docker Security |
| Phase 074 | Production Configuration |
| Phase 075 | Health Endpoint Security |
