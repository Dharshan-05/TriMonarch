# TriMonarch ERP — Rollback Strategy

## Application Container Rollback

```
Identify Failure → Route Traffic Away → Deploy Previous Known-Good Image → Verify Health
```

If the newly deployed container fails readiness checks (`GET /health/ready` returns 503):
1. Immediately stop the rolling update process.
2. Revert deployment manifest to target the previous known-good container image tag.
3. Verify that traffic routes successfully to healthy instances.

---

## Database Rollback Considerations

- Database schema rollbacks MUST be handled separately from application rollbacks.
- Ensure all database migrations are backward-compatible so that rolling back application container versions does not cause SQL column missing errors.
- If a migration fails mid-execution, PostgreSQL transactions automatically roll back the migration statements.
- If a destructive schema change must be reverted, restore from pre-deployment snapshot.
