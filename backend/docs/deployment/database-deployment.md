# TriMonarch ERP — Database Deployment

## Overview

The backend relies on PostgreSQL 16 as its relational storage engine. Detailed schema details and relationships are documented in [Phase 077 Database Documentation](../database/README.md).

---

## Connection Configuration & Connection Pool

Connection pooling is managed via `pg.Pool` in `src/config/database.ts`:

- **Pool Size**: Configurable via environment (default: max 20 client connections).
- **Idle Timeout**: Automatically closes idle connections after 30 seconds.
- **Connection Timeout**: Fails fast after 5 seconds if no connection is available.

---

## Production Security & Network Isolation

- PostgreSQL must run within an isolated private network (VPC/bridge) with no direct internet access.
- Applications connect using TLS/SSL (`DATABASE_SSL=true`).
- Storage persistence is maintained via dedicated persistent block volumes or managed database instances.
