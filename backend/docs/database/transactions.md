# TriMonarch ERP — Transaction & Locking Behavior

## Transaction Architecture

All mutation operations use explicit PostgreSQL transactions managed through the `pg` connection pool. The backend uses a transactional client pattern:

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... domain mutations
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

---

## Isolation Levels

| Level | Used For | Notes |
|---|---|---|
| `READ COMMITTED` (default) | Standard CRUD operations | Prevents dirty reads |
| `REPEATABLE READ` | Inventory updates, concurrent stock | Prevents phantom reads |
| `SERIALIZABLE` | Critical financial transactions | Highest consistency guarantee |

---

## Row Locking — `SELECT ... FOR UPDATE`

Row-level locks are acquired with `SELECT ... FOR UPDATE` to prevent lost updates under concurrent access:

```sql
-- Lock inventory row before updating stock
SELECT * FROM inventory_balances
WHERE organization_id = $1 AND product_id = $2
FOR UPDATE;
```

Used for:
- **Inventory adjustments** — prevents double-deduction of stock
- **Sales order confirmation** — locks order row during state transition
- **Purchase order receipts** — locks PO during receipt processing
- **Manufacturing order execution** — locks MO during production posting

---

## Concurrency Protection Table

| Domain | Lock Scope | Method | Protects Against |
|---|---|---|---|
| Inventory | `inventory_balances` row | `SELECT ... FOR UPDATE` | Negative stock, lost updates |
| Sales Orders | `sales_orders` row | `SELECT ... FOR UPDATE` | Duplicate confirmations |
| Purchase Orders | `purchase_orders` row | `SELECT ... FOR UPDATE` | Duplicate receipts |
| BOMs | `boms` row | `SELECT ... FOR UPDATE` | Concurrent BOM edits |
| Manufacturing Orders | `manufacturing_orders` row | `SELECT ... FOR UPDATE` | Race on status transitions |
| Business Events | Transaction boundary | `BEGIN / COMMIT` | Event loss, partial writes |
| Audit Logs | Transaction boundary | `BEGIN / COMMIT` | Audit omission |

---

## Error Handling

| PostgreSQL Code | Error | Response |
|---|---|---|
| `40001` | Serialization failure | Retry-safe; returned as `409 CONFLICT` |
| `40P01` | Deadlock detected | Returned as `503 SERVICE_UNAVAILABLE` |
| `55P03` | Lock not available (timeout) | Returned as `503 SERVICE_UNAVAILABLE` |

---

## Connection Pool Configuration

The `pg` pool is configured with:

```
DATABASE_POOL_MIN  — minimum idle connections
DATABASE_POOL_MAX  — maximum concurrent connections
DATABASE_POOL_IDLE — idle timeout before connection release
```

Pool connections are always released in `finally` blocks to prevent connection exhaustion.

---

## Audit & Event Transactional Guarantees

Audit logs and business events are written **within the same transaction** as the domain mutation. If the domain operation fails, the audit log is also rolled back. This prevents phantom audit entries for failed operations.

```
BEGIN
  → Domain mutation (e.g., update inventory)
  → Audit log write (same transaction)
  → Business event write (same transaction)
COMMIT (or ROLLBACK all together)
```
