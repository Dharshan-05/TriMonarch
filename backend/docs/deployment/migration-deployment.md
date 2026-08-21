# TriMonarch ERP — Migration Deployment

## Migration Execution Workflow

```
Pre-migration Backup → Validate Migration SQL → Execute Migrations → Verify Schema → Deploy App
```

---

## Migration Safety Rules

1. **Transaction Wrapping**: Every migration file (001–032) runs inside an explicit transaction block.
2. **Never Run Destructive Schema Mutations Without Backups**: Always perform a complete database snapshot before executing schema alterations.
3. **Idempotency**: All `CREATE TABLE` and `ADD COLUMN` migrations use `IF NOT EXISTS` clauses.
4. **Rollback Strategy**: Maintain corresponding `-- DOWN` migration SQL scripts for every schema update.
