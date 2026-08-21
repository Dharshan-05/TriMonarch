# Phase 075 — Health Checks Architecture & Mapping

## Endpoint Overview

1. **`GET /health` (Docker Compatibility)**
   - Returns 200 OK with operational status, database health, and process uptime. Used by Docker container health checks.
2. **`GET /health/live` (Kubernetes Liveness Probe)**
   - Returns 200 OK as long as the process is alive and HTTP server is listening. Does NOT query PostgreSQL.
3. **`GET /health/ready` (Kubernetes Readiness Probe)**
   - Returns 200 OK when database is reachable. Returns 503 Service Unavailable if PostgreSQL connection fails or times out.

---

## Sanitized Response Schema

```json
{
  "status": "ready",
  "service": "trimonarch-erp-backend",
  "timestamp": "2026-08-20T23:50:00.000Z",
  "checks": {
    "database": "ok"
  }
}
```

No database passwords, hosts, stack traces, or credentials are ever returned.
