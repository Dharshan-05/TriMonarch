# TriMonarch ERP — Scaling Architecture

## Horizontal Backend Scaling

- **Stateless Architecture**: Because authentication relies on signed JWT tokens and token revocations are stored in PostgreSQL (`auth_token_revocations`), any backend container instance can handle any incoming request.
- **Load Balancing**: Multiple backend instances can run behind a standard round-robin or least-connections HTTP load balancer.
- **Connection Pool Capacity**: When scaling horizontally, ensure the aggregate PostgreSQL connection pool across all instances does not exceed PostgreSQL's `max_connections` limit.

---

## Performance & Concurrency Tuning

- Verified in Phase 065 (Concurrency & Load Testing).
- Inventory row locking (`SELECT FOR UPDATE`) prevents race conditions and data corruption across concurrent instances.
