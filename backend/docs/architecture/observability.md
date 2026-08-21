# TriMonarch ERP — Observability Architecture

## Overview

Every request is correlated, logged, and metered. Observability is non-invasive — it does not alter API behavior or expose sensitive information.

---

## Observability Stack

```
HTTP Request
     ↓
requestIdHandler     ← Attach/generate X-Request-ID
     ↓
requestLogger        ← Log request start
     ↓
Application
     ↓
StructuredLogger     ← Domain-level structured logs (Pino)
     ↓
requestLogger        ← Log response (status, duration)
     ↓
recordHttpMetric     ← Increment Prometheus counters
     ↓
/metrics endpoint    ← Prometheus text format scrape
```

---

## Structured Logging

Located at: `src/observability/logger.ts`

The `StructuredLogger` wraps Pino and provides automatic redaction of sensitive fields:

```typescript
logger.info({ userId: user.id, action: 'PRODUCT_CREATED' }, 'Product created');
```

Redacted fields (replaced with `[REDACTED]`):
- `password`
- `token`
- `secret`
- `authorization`
- `refreshToken`
- `accessToken`
- `passwordHash`

JSON log format:
```json
{
  "level": "info",
  "message": "Product created",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "requestId": "uuid",
  "userId": "uuid",
  "action": "PRODUCT_CREATED"
}
```

---

## Request Correlation

Located at: `src/middleware/requestId.ts`

Every HTTP request receives a `X-Request-ID` header:

1. If the client sends `X-Request-ID: <client-id>` → the server echoes it
2. If not provided → the server generates a UUID v4

The `requestId` is attached to every log line for that request, enabling end-to-end trace correlation.

---

## Request Logging

Located at: `src/middleware/requestLogger.ts`

Logs every HTTP request with:

```json
{
  "method": "POST",
  "path": "/api/v1/products",
  "statusCode": 201,
  "durationMs": 42,
  "requestId": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Metrics

Located at: `src/observability/metrics.ts`

Exposes Prometheus-format metrics at `GET /metrics`:

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/products",status="200"} 42

# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{...} ...
```

The endpoint does **not** require authentication but is typically restricted to internal network access in production.

---

## Health Endpoints

Located at: `src/health/index.ts`

| Endpoint | Purpose | Auth Required |
|----------|---------|--------------|
| `GET /health` | Overall health (Docker compatibility) | No |
| `GET /health/live` | Liveness — process is running | No |
| `GET /health/ready` | Readiness — database connected | No |
| `GET /ready` | Alias for `/health/ready` | No |

### Readiness Response (healthy)

```json
{
  "status": "ready",
  "database": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Readiness Response (unhealthy)

```json
{
  "status": "not_ready",
  "database": "unhealthy",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

HTTP `503 Service Unavailable` when unhealthy.

---

## Database Health Probe

Located at: `src/health/databaseHealth.ts`

```typescript
export const checkDatabaseHealth = async (timeoutMs = 3000): Promise<boolean> => {
  // Runs: SELECT 1 with timeout
  // Returns true if connected, false on any error
};
```

---

## Security Constraints on Observability

- Health endpoints do **not** expose credentials, connection strings, or internal IPs
- Log redaction prevents password/token leakage
- Metrics do not include high-cardinality labels (no user IDs, organization IDs)
- Stack traces are never written to response bodies in production

---

## Graceful Shutdown Observability

On `SIGTERM` or `SIGINT`:

1. Log: `"Graceful shutdown initiated"`
2. Stop accepting new connections (`server.close()`)
3. Drain connection pool (`closeDatabasePool()`)
4. Log: `"Graceful shutdown complete"`

This ensures logs reflect the true lifecycle state of the process.
