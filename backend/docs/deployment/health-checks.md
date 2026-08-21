# TriMonarch ERP — Health Checks & Status Endpoints

## Health Endpoint Inventory

Established in Phase 075 (`src/health/index.ts`):

| Endpoint | Purpose | Dependencies Checked | Success Status | Failure Status |
|----------|---------|----------------------|----------------|----------------|
| `GET /health` | Application status (Docker compatibility) | Express process | 200 OK | 500 / 503 |
| `GET /health/live` | Process liveness check | None (process running) | 200 OK | 500 |
| `GET /health/ready` | Operational readiness check | PostgreSQL database connection | 200 OK | 503 Service Unavailable |
| `GET /ready` | Alias for `/health/ready` | PostgreSQL database connection | 200 OK | 503 Service Unavailable |
| `GET /metrics` | Prometheus metrics scrape target | Metrics collector | 200 OK | 500 |

---

## Response Contracts

### Liveness Probe (`GET /health/live`)
```json
{
  "status": "ok",
  "timestamp": "2026-08-21T00:00:00.000Z",
  "uptime": 120.45
}
```

### Readiness Probe (`GET /health/ready` - Healthy)
```json
{
  "status": "ready",
  "database": "healthy",
  "timestamp": "2026-08-21T00:00:00.000Z",
  "uptime": 120.45
}
```
