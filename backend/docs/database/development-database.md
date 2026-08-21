# TriMonarch ERP — Development Database Setup

## Overview

The development database is a local PostgreSQL instance used during active development of the TriMonarch ERP backend. It is initialized via migrations and optionally seeded with fixture data.

---

## Prerequisites

- PostgreSQL 14+ running locally **or** via Docker (see Phase 072/073)
- `DATABASE_URL` environment variable set in `.env`

---

## Environment Configuration

Create a `.env` file in `backend/` (never commit real credentials):

```dotenv
# Database
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_dev

# JWT
JWT_SECRET=local-dev-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=local-dev-refresh-secret-minimum-32-characters
```

A `.env.example` template is provided with placeholder values.

---

## Database Initialization

```bash
# Apply all pending migrations
npm run db:migrate

# (Optional) Seed with development fixture data
npm run db:seed
```

---

## Development Seed Data

The seeder (`src/database/seed.ts`) creates idempotent fixture records:

| Entity | Value |
|--------|-------|
| Organization | `ACME Corporation` (code: `ACME_CORP`) |
| Admin User | `admin@acme.com` / `Password123!` |
| Role | `Administrator` (code: `ADMIN`) |
| Department | `Engineering` (code: `ENG`) |
| Employee | `John Doe` — `EMP-001` |
| Product | `Widget Alpha` (SKU: `WGT-001`) |
| Warehouse | `Central Warehouse` (code: `WH-CENTRAL`) |
| Inventory | 100 units of WGT-001 in WH-CENTRAL |
| Customer | `Global Tech Inc` |
| Supplier | `Components Corp` |

> **Security**: The seed password `Password123!` is for development only. Never use this in staging or production environments.

---

## Docker Development Database

With Phase 073 Docker Compose, the development database is fully containerized:

```bash
# Start full development environment
docker compose up -d

# Apply migrations inside the container
docker compose exec backend npm run db:migrate

# Seed development data
docker compose exec backend npm run db:seed
```

The PostgreSQL container persists data in a named Docker volume: `postgres-data`.

---

## Resetting the Development Database

```bash
# Drop and recreate the database (destroys all data)
dropdb erp_dev && createdb erp_dev

# Reapply all migrations
npm run db:migrate

# Reseed
npm run db:seed
```

For Docker:

```bash
docker compose down -v    # destroys the postgres-data volume
docker compose up -d      # recreates fresh
```

---

## Development vs. Production / Supabase

| Concern | Development (Local/Docker) | Cloud / Supabase PostgreSQL |
|---------|----------------------------|----------------------------|
| Architecture | React → Express → `pg` → Local Postgres | React → Express → `pg` → Supabase Postgres |
| Credentials | `.env` file (`localhost:5432`) | `.env` (`DATABASE_URL` / Supabase host) |
| Database | `erp_db` / `erp_dev` | `postgres` / `erp_db` |
| SSL | `DATABASE_SSL=false` | `DATABASE_SSL=true` (or auto via `DATABASE_URL`) |
| Seed data | Yes (`npm run db:seed`) | Yes (`npm run db:seed`) |
| Migrations | `npm run db:migrate` | `npm run db:migrate` |

---

## Supabase PostgreSQL Setup

To configure the backend to use a Supabase managed PostgreSQL database:

1. Obtain your Supabase Connection String from the Supabase Project Dashboard (Settings → Database → Connection string → Transaction / Session pooler or Direct connection).
2. Set `DATABASE_URL` in `backend/.env`:
   ```dotenv
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   ```
3. Execute migrations against Supabase:
   ```bash
   npm run db:migrate
   ```
4. Seed the initial admin user and fixtures:
   ```bash
   npm run db:seed
   ```

