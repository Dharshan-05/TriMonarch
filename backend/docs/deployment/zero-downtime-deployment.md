# TriMonarch ERP — Zero-Downtime Deployment

## Strategy & Principles (Recommended / Infrastructure Dependent)

```
New Container Rollout → Readiness Gate Pass → Route Traffic → Graceful Shutdown Old Container
```

1. **Stateless API Layer**: The backend stores zero session state in local container memory (JWT authentication is stateless).
2. **Rolling / Blue-Green Deployments**: Deploy new container replicas alongside existing instances.
3. **Readiness Gating**: Reverse proxy / load balancer routes traffic to new containers ONLY after `/health/ready` returns HTTP 200 OK.
4. **Graceful Connection Draining**: Upon receiving `SIGTERM`, existing container instances stop accepting new requests, drain pending requests, and terminate cleanly without dropping active connections.
