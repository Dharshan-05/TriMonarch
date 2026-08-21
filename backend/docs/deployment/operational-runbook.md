# TriMonarch ERP — Operational Runbook

## Daily Operations Checklists

### 1. Daily Startup & Deployment Verification Checklist

- [ ] Execute pre-deployment test suite (`npm run test`).
- [ ] Build and push verified container image (`docker build`).
- [ ] Run schema migrations (`npm run db:migrate`).
- [ ] Verify liveness probe (`GET /health/live` -> 200).
- [ ] Verify readiness probe (`GET /health/ready` -> 200).
- [ ] Inspect error rate and latencies via Prometheus `/metrics`.

---

### 2. Graceful Shutdown Checklist

- [ ] Issue `SIGTERM` to backend container instance.
- [ ] Confirm log output reports `"Graceful shutdown initiated"`.
- [ ] Verify load balancer stops routing new requests to shutting-down instance.
- [ ] Confirm database connection pool drains and logs `"Graceful shutdown complete"`.

---

### 3. Incident Response Checklist

- [ ] Identify failing component via `/health/ready` and `/metrics`.
- [ ] Review structured Pino logs for error details (`requestId`, error codes).
- [ ] If container is unstable, perform application rollback to previous image tag.
- [ ] If database is unresponsive, verify network connectivity and connection pool stats.
