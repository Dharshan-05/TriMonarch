# TriMonarch ERP — Validation Architecture

## Overview

All externally-supplied input is validated using **Zod** before reaching any service or repository. Unknown fields are stripped. Invalid input returns `422 Unprocessable Entity`.

---

## Validation Layers

| Layer | What Is Validated |
|-------|------------------|
| Request body | `req.body` — parsed from `application/json` |
| Query parameters | `req.query` — search, pagination, filters |
| Path parameters | `req.params` — UUIDs, identifiers |
| Environment variables | `src/config/env.ts` — startup-time validation |

---

## Validation Middleware

Located at `src/middleware/validation.ts`:

```typescript
export const zodValidate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return next(new ValidationError('Input validation failed', errors));
    }

    req.validatedBody = result.data.body;
    req.validatedQuery = result.data.query;
    req.validatedParams = result.data.params;
    next();
  };
```

---

## Schema Strategy

Each domain has its own schema file in `src/schemas/`:

```
src/schemas/
├── common.schema.ts          # uuidSchema, paginationSchema, decimalSchema
├── decimal.schema.ts         # NUMERIC(19,4) precision validation
├── password.schema.ts        # Password complexity rules
├── auth.schema.ts            # Login, refresh, password change schemas
├── product.schema.ts         # Product create/update schemas
├── salesOrder.schema.ts      # Sales order create + filter schemas
├── ...
```

---

## Common Schemas

### UUID Validation

```typescript
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID' });
```

All path parameters that represent entity IDs are validated as UUIDs. Invalid UUIDs return `422` before the controller runs.

### Decimal Precision

```typescript
export const decimalSchema = z
  .string()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, 'Must be a valid decimal with up to 4 decimal places');
```

Monetary and quantity fields are validated as strings with numeric pattern before being parsed to `NUMERIC`.

### Pagination

```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

---

## Unknown Field Handling (Mass Assignment Protection)

Zod schemas use `.strict()` or `.strip()` modes to prevent mass assignment:

```typescript
export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(255),
    unit: z.string().min(1).max(50).default('pcs'),
    // organization_id intentionally omitted — taken from JWT only
  }).strict(), // rejects extra keys
});
```

Fields like `organization_id`, `id`, `created_at`, `updated_at` are **never** accepted from request bodies.

---

## Enum Validation

Status fields are validated against exact allowed values:

```typescript
status: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']),
```

Unknown status values return `422` before state machine evaluation.

---

## Date Validation

```typescript
const isoDateSchema = z.string().datetime({ offset: true });
```

Dates must be valid ISO 8601 strings. Non-dates, NaN, and out-of-range dates are rejected.

---

## Numeric Validation

Quantity fields:
```typescript
quantity: z.number().positive().finite(),
```

Price fields:
```typescript
price: z.string().regex(/^\d+(\.\d{1,4})?$/).transform(parseDecimal),
```

Negative quantities and `NaN`/`Infinity` are rejected at the schema level.

---

## Environment Validation

`src/config/env.ts` uses Zod to validate all environment variables at startup:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});
```

If any required variable is missing or invalid, the process exits immediately with a clear error.
