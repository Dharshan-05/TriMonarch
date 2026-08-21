# Phase 075 — Structured Logging Architecture

## JSON Log Schema

All application and HTTP request logs are formatted as machine-readable JSON:

```json
{
  "level": "info",
  "message": "HTTP request completed",
  "timestamp": "2026-08-20T23:50:00.000Z",
  "requestId": "req-xyz-12345",
  "method": "GET",
  "path": "/api/v1/products",
  "statusCode": 200,
  "durationMs": 12,
  "userAgent": "Mozilla/5.0..."
}
```

## Automatic Redaction Policy

Keys containing `authorization`, `password`, `token`, `secret`, `cookie`, `jwt`, `access_token`, or `refresh_token` are automatically scrubbed and replaced with `[REDACTED]`.
