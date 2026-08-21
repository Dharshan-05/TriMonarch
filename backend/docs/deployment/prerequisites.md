# TriMonarch ERP — Deployment Prerequisites

## Minimum System Requirements

### Software Requirements

- **Node.js**: v20.x LTS (runtime environment)
- **npm**: v9.x or higher
- **Docker Engine**: v24.0+ (for container deployment)
- **Docker Compose**: v2.20+ (for orchestration)
- **PostgreSQL**: v16.x (primary persistence database)

---

## Infrastructure & Environment Requirements

| Resource | Development | Production |
|----------|-------------|------------|
| CPU | 2 Cores | 4+ Cores |
| RAM | 4 GB | 8+ GB |
| Disk | 20 GB SSD | 100+ GB NVMe |
| Network | Localhost | Isolated VPC + TLS Load Balancer |

---

## Access & Permissions

- **Container Permissions**: Non-root runtime user (`node` / `erp` UID 1000)
- **Database Permissions**: DDL rights for migration runner; DML rights (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for application runtime user.
- **Secrets Access**: Access to injected environment variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).
