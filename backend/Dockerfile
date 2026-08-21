# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
LABEL org.opencontainers.image.title="TriMonarch ERP Backend"
LABEL org.opencontainers.image.description="Production container for TriMonarch ERP Backend Service"
LABEL org.opencontainers.image.version="1.0.0"

# Stage 2: Dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Builder
FROM dependencies AS builder
COPY . .
RUN npm run build

# Stage 4: Production Runtime
FROM base AS production
ENV NODE_ENV=production
ENV PORT=8000

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "dist/server.js"]
