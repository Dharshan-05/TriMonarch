# TriMonarch ERP — Deployment Documentation

## Sitemap

This directory contains the complete deployment, operations, and disaster recovery reference for the TriMonarch ERP backend.

| Document | Purpose |
|----------|---------|
| [deployment-overview.md](./deployment-overview.md) | Deployment architecture, topology, lifecycle flows |
| [prerequisites.md](./prerequisites.md) | Minimum infrastructure, node, docker, postgres requirements |
| [environment-configuration.md](./environment-configuration.md) | Environment variables, Zod validation, production safety checks |
| [docker-deployment.md](./docker-deployment.md) | Multi-stage Docker build, non-root user, image optimization |
| [production-deployment.md](./production-deployment.md) | Step-by-step production deployment procedure and quality gates |
| [database-deployment.md](./database-deployment.md) | PostgreSQL 16 connection pooling, networking, persistent storage |
| [migration-deployment.md](./migration-deployment.md) | Production migration execution, backups, rollbacks, safety rules |
| [ci-cd.md](./ci-cd.md) | Automated CI/CD pipeline stages, quality gates, failure handling |
| [health-checks.md](./health-checks.md) | Liveness (`/health/live`), readiness (`/health/ready`), Docker (`/health`) probes |
| [observability.md](./observability.md) | Structured Pino logging, request correlation IDs, Prometheus `/metrics` |
| [security.md](./security.md) | Non-root runtime, network isolation, TLS, input validation |
| [secrets-management.md](./secrets-management.md) | JWT secrets, database passwords, secret injection and rotation |
| [backup-and-recovery.md](./backup-and-recovery.md) | PostgreSQL backup strategy, RPO/RTO targets, restore verification |
| [rollback.md](./rollback.md) | Application container and database schema rollback strategies |
| [zero-downtime-deployment.md](./zero-downtime-deployment.md) | Rolling deployment, readiness gating, connection draining |
| [scaling.md](./scaling.md) | Horizontal scaling, stateless design, connection pool capacity |
| [troubleshooting.md](./troubleshooting.md) | Symptom-cause-resolution runbooks for deployment issues |
| [operational-runbook.md](./operational-runbook.md) | Production operator checklists for startup, shutdown, incidents |
| [disaster-recovery.md](./disaster-recovery.md) | Complete disaster restoration procedures and verification |

---

## Quick Reference Commands

```bash
# Validate production configuration & build
npm run typecheck && npm run build

# Run all test suites prior to deployment
npm run test

# Run deployment documentation audit
npm run test:docs:deployment
```
