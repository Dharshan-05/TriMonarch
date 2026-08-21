# TriMonarch ERP — Docker Deployment

## Multi-Stage Dockerfile Architecture

The production Docker image (`Dockerfile`) uses a 3-stage multi-stage build strategy based on `node:20-alpine`:

```dockerfile
# Stage 1: Dependency Installation
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build Stage (TypeScript Compilation)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production Runtime Stage
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S erp && adduser -S erp -G erp
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY migrations ./migrations

USER erp
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

---

## Key Container Security & Optimization Practices

- **Minimal Base Image**: Uses `node:20-alpine` to reduce overall image size and attack surface.
- **Non-Root Execution**: Runs under unprivileged `node` / `erp` user (UID 1000).
- **Built-in Healthcheck**: Includes standard HTTP healthcheck querying `http://localhost:3000/health`.
- **Reproducible Build**: Clean dependency installation via `npm ci`.

---

## Build & Deployment Commands

```bash
# Build image
docker build -t trimonarch-backend:<IMAGE_TAG> .

# Run container with environment configuration
docker run -d \
  --name trimonarch-backend \
  -p 3000:3000 \
  --env-file .env.production \
  trimonarch-backend:<IMAGE_TAG>
```
