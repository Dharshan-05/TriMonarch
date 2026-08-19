# ERP Backend Service

Comprehensive Node.js, Express, and PostgreSQL backend foundation built with TypeScript strict mode, Zod environment validation, Pino structured logging, Vitest test suite, explicit database schema migration foundation, and type-safe repository data access layer.

## Prerequisites

- **Node.js**: v18+ or v20+
- **npm**: v9+
- **PostgreSQL**: v14+ (running database instance required for PostgreSQL connection)

## Data Access Architecture

```text
Controller
    ↓
Service
    ↓
Repository Layer (Organization, User, Role, Dept, Employee, Product, Warehouse, Inventory, Customer, Supplier)
    ↓
Query / Transaction Layer (query.ts, transaction.ts, errors.ts)
    ↓
pg.Pool
    ↓
PostgreSQL Database
```

### Core Repository Principles

1. **Explicit Organization Scoping**: Multi-tenant data access routines accept `organizationId` to enforce strict organization boundary isolation.
2. **Parameterized Queries**: All queries pass parameters through explicit SQL arrays (`$1, $2, ...`), preventing SQL injection.
3. **Strict Sort Whitelisting**: Sorting fields in `buildPaginationClause` validate input against an explicit array of allowed column names.
4. **Transaction Abstraction**: `withTransaction(async (client) => { ... })` ensures atomic operations with automatic `BEGIN`, `COMMIT`, `ROLLBACK`, and safe client release.
5. **Normalized Error Handling**: Intercepts PostgreSQL constraint codes (`23505`, `23503`, `23514`, `23502`) and translates them into application domain errors (`DuplicateKeyError`, `ForeignKeyViolationError`, etc.).

---

## Repositories & Operations Overview

| Repository | Scope / Key Operations |
| --- | --- |
| `OrganizationRepository` | `create`, `findById`, `findByCode`, `list`, `update`, `delete` |
| `UserRepository` | `create`, `findById`, `findByEmail`, `listByOrganization`, `update`, `delete` |
| `RoleRepository` | `create`, `findById`, `findByCode`, `listByOrganization`, `update`, `delete`, `assignRoleToUser`, `removeRoleFromUser`, `listUserRoles` |
| `DepartmentRepository` | `create`, `findById`, `findByCode`, `listByOrganization`, `update`, `delete` |
| `EmployeeRepository` | `create`, `findById`, `findByEmployeeCode`, `listByOrganization`, `listByDepartment`, `update`, `delete` |
| `ProductRepository` | `create`, `findById`, `findBySku`, `search`, `listByOrganization`, `update`, `delete` |
| `WarehouseRepository` | `create`, `findById`, `findByCode`, `listByOrganization`, `update`, `delete` |
| `InventoryRepository` | `create`, `findById`, `findByProduct`, `findByWarehouse`, `findByProductAndWarehouse`, `listByOrganization`, `updateQuantity`, `update`, `delete` |
| `CustomerRepository` | `create`, `findById`, `search`, `listByOrganization`, `update`, `delete` |
| `SupplierRepository` | `create`, `findById`, `search`, `listByOrganization`, `update`, `delete` |

---

## Database Migration & CLI Commands

- **Run Up Migrations**: `npm run db:migrate`
- **Rollback Migration**: `npm run db:rollback`
- **Check Migration Status**: `npm run db:status`
- **Seed Development Data**: `npm run db:seed`

## Development & Build Commands

- **Development Server**: `npm run dev`
- **TypeScript Typecheck**: `npm run typecheck`
- **Production Build**: `npm run build`
- **Run Tests**: `npm run test`
- **ESLint Linting**: `npm run lint`
- **Prettier Format**: `npm run format`

## API Endpoints

### `GET /health`
Returns system status and PostgreSQL connectivity.
