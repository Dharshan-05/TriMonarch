# TriMonarch ERP — Deployment Observability

## Overview

Observability infrastructure was established in Phase 075 (`src/observability/`).

---

## Log Management & Correlation

- **Structured JSON Logging**: Powered by Pino (`src/observability/logger.ts`).
- **Request Correlation**: Every request is assigned or inherits an `X-Request-ID` header.
- **Redaction Rules**: Passwords, hashes, authorization tokens, and JWT secrets are automatically scrubbed from log output (`[REDACTED]`).

---

## Metrics & Monitoring

- **Prometheus Scrape Endpoint**: Exposed at `GET /metrics`.
- **Tracked Metrics**: HTTP request count, request duration histograms, error rates, and database probe health.
