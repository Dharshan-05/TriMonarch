# ERP Backend Service

Comprehensive Node.js, Express, and PostgreSQL backend service built with TypeScript strict mode, Zod environment validation, Pino structured logging, Vitest test suite, explicit database schema migration foundation, type-safe repository data access layer, production-grade REST API architecture, JWT authentication layer, robust transaction management, durable Audit Logging subsystem, exact Decimal & Financial Precision layer, generic Repository Architecture, UserRepository, Partner Repositories, Product Repository, BOM Repository, Sales Order Repository, Purchase Order Repository, Manufacturing Repository, Stock Ledger Repository, Audit Log Repository, Product Service, Partner Service, Inventory Core Engine (`InventoryService`), Stock Reservation Engine (`StockReservationService`), Stock Adjustment Engine (`StockAdjustmentService`), Inventory Concurrency Control subsystem, Sales Order Service (`SalesOrderService`), and Sales Order State Machine (`SalesOrderStateMachineService`).

## Prerequisites

- **Node.js**: v18+ or v20+
- **npm**: v9+
- **PostgreSQL**: v14+ (running database instance required for PostgreSQL connection)

## Sales Order State Machine (`src/services/salesOrderStateMachine.service.ts`)

`SalesOrderStateMachineService` governs all valid Sales Order lifecycle transitions:

- **Supported Lifecycle States**:
  - `draft` -> `confirmed` | `cancelled`
  - `confirmed` -> `processing` | `cancelled`
  - `processing` -> `shipped` | `cancelled`
  - `shipped` -> `completed`
  - `completed` (Terminal State)
  - `cancelled` (Terminal State)
- **Business Rules**:
  - `draft` -> `confirmed`: Customer must exist in org, order must contain >= 1 line item (`SalesOrderMissingItemsError`), items must have `quantity > 0` and `unit_price >= 0`.
  - Cancellation allowed from `draft`, `confirmed`, `processing`.
  - Direct status bypass via `SalesOrderService.updateSalesOrder` is prevented (`ValidationError`).
- **Concurrency & Transaction Policy**: Uses `SELECT ... FOR UPDATE` row locks (`salesOrderRepository.lockByIdForUpdate`) inside `withTransaction` with Category A audit logging (`SALES_ORDER_STATUS_TRANSITION`).

---

## Sales Order Service (`src/services/salesOrder.service.ts`)

`SalesOrderService` provides a production-grade business layer for Sales Orders and Sales Order Items.

---

## Inventory Concurrency Control (`src/repositories/inventory.repository.ts`, `src/services/*`)

`Phase 024` hardens all inventory, reservation, adjustment, and ledger engines against concurrent execution race conditions.

---

## Stock Adjustment Engine (`src/services/stockAdjustment.service.ts`)

`StockAdjustmentService` provides a production-grade Stock Adjustment Engine.

---

## Stock Reservation Engine (`src/services/stockReservation.service.ts`)

`StockReservationService` provides a production-grade, multi-tenant Stock Reservation Engine.

---

## Inventory Core Engine (`src/services/inventory.service.ts`)

`InventoryService` provides a centralized business layer for inventory quantity operations (`increaseStock`, `decreaseStock`, `adjustStock`).

---

## Partner Service (`src/services/partner.service.ts`)

`PartnerService` provides unified business workflows for both Customers and Suppliers.

---

## Product Service (`src/services/product.service.ts`)

`ProductService` provides transactional business workflows for managing products.

---

## Stock Reservation Repository (`src/repositories/stockReservation.repository.ts`)

`StockReservationRepository` extends `BaseRepository<StockReservation, CreateStockReservationInput, UpdateStockReservationInput, StockReservationFilterParams>`.

---

## Stock Ledger Repository (`src/repositories/stockLedger.repository.ts`)

`StockLedgerRepository` extends `BaseRepository<StockLedgerEntry, CreateStockLedgerInput, never, StockLedgerFilterParams>`.

---

## Manufacturing Repository (`src/repositories/manufacturing.repository.ts`)

`ManufacturingRepository` extends `BaseRepository<ManufacturingOrder, CreateManufacturingOrderInput, UpdateManufacturingOrderInput, ManufacturingOrderFilterParams>`.

---

## Purchase Order Repository (`src/repositories/purchaseOrder.repository.ts`)

`PurchaseOrderRepository` extends `BaseRepository<PurchaseOrder, CreatePurchaseOrderInput, UpdatePurchaseOrderInput, PurchaseOrderFilterParams>`.

---

## Sales Order Repository (`src/repositories/salesOrder.repository.ts`)

`SalesOrderRepository` extends `BaseRepository<SalesOrder, CreateSalesOrderInput, UpdateSalesOrderInput, SalesOrderFilterParams>`.

---

## BOM Repository (`src/repositories/bom.repository.ts`)

`BomRepository` extends `BaseRepository<Bom, CreateBomInput, UpdateBomInput, BomFilterParams>`.

---

## Product Repository (`src/repositories/product.repository.ts`)

`ProductRepository` extends `BaseRepository<Product, CreateProductInput, UpdateProductInput, ProductFilterParams>`.

---

## User Repository (`src/repositories/user.repository.ts`)

`UserRepository` extends `BaseRepository<User, CreateUserInput, UpdateUserInput, UserFilterParams>`.

---

## Repository Architecture

```text
Controller Layer (HTTP / Express / Status Codes)
    ↓
Service Layer / Core Engine (Business Workflow / Validation)
    ↓
withTransaction(callback, options) ── (Optional PoolClient)
    ↓
Repository Layer (BaseRepository<T, CreateInput, UpdateInput, Filter>)
    ├── Parameterized SQL ($1, $2, ...)
    ├── Organization Scoping (WHERE organization_id = $1)
    ├── Sort Column Allowlist (sanitizeSortColumn)
    └── Decimal Primitive Preservation ("123456789.1234")
    ↓
PostgreSQL Query Layer (query.ts / pg Pool)
    ↓
PostgreSQL Database
```

---

## Commands & Testing

- **Development Server**: `npm run dev`
- **TypeScript Typecheck**: `npm run typecheck`
- **Production Build**: `npm run build`
- **Run Tests**: `npm run test`
- **ESLint Linting**: `npm run lint`
- **Prettier Format**: `npm run format`
- **Migrations**: `npm run db:migrate`
- **Seed Data**: `npm run db:seed`
