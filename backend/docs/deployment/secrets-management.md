# TriMonarch ERP — Secrets Management

## Secrets Policy & Strict Rules

1. **Zero Hardcoded Secrets**: Secrets are NEVER embedded in source code, Dockerfiles, or image layers.
2. **Environment Variable Injection**: All production credentials (`DATABASE_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`) must be injected at container startup via secure external secret managers (e.g. AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).
3. **Placeholder Standard**: Documentation and example files must exclusively use generic placeholders:
   - `<JWT_SECRET>`
   - `<DATABASE_PASSWORD>`
   - `<DATABASE_HOST>`
   - `<REGISTRY_URL>`
   - `<IMAGE_TAG>`
4. **Automated Secret Redaction**: Application logger automatically redacts sensitive key patterns from console/file outputs.
5. **Secret Rotation**: Rotate JWT secrets and database credentials periodically without breaking active user sessions by supporting multi-key evaluation or graceful token re-issuance windows.
