# TriMonarch ERP — Deployment Troubleshooting Guide

## Troubleshooting Matrix

| Issue Symptoms | Possible Causes | Verification Method | Resolution Step |
|----------------|-----------------|---------------------|-----------------|
| Container fails to start | Invalid environment variable / short secret | Check logs: `docker logs <CONTAINER>` | Ensure `JWT_SECRET` >= 32 chars and valid `DATABASE_URL` |
| `/health/ready` returns 503 | Database unavailable or unreachable | Test connection with `pg_isready` | Verify database host network and credentials |
| Database connection timeout | Pool connection exhaustion | Inspect `/metrics` pool count | Increase DB pool max size or scale DB instance |
| Rate limit 429 errors | Client exceeding request rate limits | Inspect `X-RateLimit-*` headers | Adjust `RATE_LIMIT_MAX` or optimize client requests |
| CORS failure on browser requests | Missing client origin in `CORS_ORIGIN` | Check browser developer console | Add client URL to `CORS_ORIGIN` environment variable |
| Container memory limit exit (OOM) | Memory threshold exceeded | Run `docker stats` | Increase container RAM limit in deployment manifest |
