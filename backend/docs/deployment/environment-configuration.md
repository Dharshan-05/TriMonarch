# TriMonarch ERP — Environment Configuration

## Overview

The application utilizes strict, fail-fast environment validation via `src/config/env.ts` (Zod validation) and `src/config/production.ts` (production safety validation).

---

## Required Environment Variables

| Variable | Type | Validation Rules | Description |
|----------|------|------------------|-------------|
| `NODE_ENV` | String | `development` \| `test` \| `production` | Execution mode |
| `PORT` | Number | Integer, Default `3000` | HTTP listening port |
| `DATABASE_URL` | String | Valid PostgreSQL URL | Connection string |
| `JWT_SECRET` | String | Min length 32 chars in prod | Access token secret |
| `JWT_REFRESH_SECRET` | String | Min length 32 chars in prod | Refresh token secret |
| `CORS_ORIGIN` | String | Valid URL or comma-separated list | Allowed origins |

---

## Production Fail-Fast Safeguards (`src/config/production.ts`)

When `NODE_ENV=production`, the application performs immediate fail-fast validation on startup:

1. **Secret Length Enforcement**: `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters long.
2. **Default Secret Rejection**: Known default secrets (e.g. `<DEVELOPMENT_SECRET>`) cause immediate process exit.
3. **Database URL Validation**: `DATABASE_URL` must be formatted as a valid PostgreSQL URL pointing to a non-localhost target.

### Example Placeholder Configuration

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://<DATABASE_USER>:<DATABASE_PASSWORD>@<DATABASE_HOST>:5432/<DATABASE_NAME>
JWT_SECRET=<PRODUCTION_JWT_SECRET_32_CHARS_MIN>
JWT_REFRESH_SECRET=<PRODUCTION_REFRESH_SECRET_32_CHARS_MIN>
CORS_ORIGIN=https://erp.example.com
```
