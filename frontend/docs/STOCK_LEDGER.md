# Stock Ledger UI Architecture & Documentation

## Overview

The Stock Ledger module provides an immutable, production-grade audit trail UI for physical stock movement transactions across the Mini ERP. It captures intake movements (`IN`), outflow shipments (`OUT`), inventory adjustments (`ADJUSTMENT`), and warehouse stock transfers (`TRANSFER_IN`, `TRANSFER_OUT`), while providing deep traceability to source documents (Purchase Receipts, Sales Deliveries, Stock Adjustments).

---

## 1. Feature Architecture

Located within `frontend/src/features/stock-ledger/`:

```
src/features/stock-ledger/
├── components/
│   ├── StockLedgerKpiGrid.tsx             # Summary metric cards (Total Records, Stock Intake Volume, Outflow Volume, Audit Adjustments)
│   ├── StockLedgerToolbar.tsx             # Search input, movement type filter, date range, & active inventory context tag
│   ├── StockLedgerTable.tsx               # High-density audit ledger table with signed quantities & movement badges
│   ├── StockLedgerMovementBadge.tsx       # Dedicated badge component for movement classifications (IN, OUT, ADJUSTMENT, TRANSFER)
│   └── StockLedgerDetailModal.tsx         # Immutable audit profile inspector with cross-module deep links
├── hooks/
│   └── useStockLedger.ts                  # TanStack Query query hooks for audit trail records
├── types/
│   └── stock-ledger.types.ts              # Filter state and movement type models
└── pages/
    └── StockLedgerPage.tsx                # Page controller mounted at /stock-ledger and /inventory/ledger
```

---

## 2. API Contract & Integration

Base path: `/api/v1/stock-ledger` and `/api/v1/inventory/:id/movements` (Authenticated)

- **List General Ledger Entries**: `GET /api/v1/stock-ledger` (Permission: `inventory:read` or `stock_ledger:read`, Query params: `page`, `pageSize`, `query`, `search`, `movementType`, `referenceType`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`)
- **List Inventory Movements**: `GET /api/v1/inventory/:id/movements` (Permission: `inventory:read`, Query params: `page`, `pageSize`)
- **Get Ledger Entry Detail**: `GET /api/v1/stock-ledger/:id` (Permission: `inventory:read`)
- **Immutability Enforcement**: Stock Ledger entries are strictly append-only; update (`PATCH`/`PUT`) and delete (`DELETE`) operations are disabled at both backend and frontend layers.

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`, `balance_after`) are stored and transmitted as string-encoded decimals (e.g., `'500.0000'`, `'-50.0000'`).
- Signed quantity presentation:
  - `IN` / `TRANSFER_IN`: Positive green badge (`+500.0000`)
  - `OUT` / `TRANSFER_OUT`: Negative red badge (`-50.0000`)
  - `ADJUSTMENT`: Signed delta badge
- Numeric table columns apply `tabular-nums` CSS and `formatNumber` to eliminate floating-point representation loss.

---

## 4. RBAC & Access Control

- Governed by permissions:
  - `inventory:read` / `stock_ledger:read`: View stock ledger movements, KPI summary metrics, and detail inspectors.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read access
  - `EMPLOYEE`: Read access
  - `AUDITOR`: Read-only audit access

---

## 5. Supply Chain Integration & Traceability

```
Purchase Goods Receipt (posted) ──→ Stock Ledger (movement_type = 'IN', reference_type = 'PURCHASE_RECEIPT')
Sales Delivery (completed)       ──→ Stock Ledger (movement_type = 'OUT', reference_type = 'SALES_DELIVERY')
Stock Adjustment (submitted)     ──→ Stock Ledger (movement_type = 'ADJUSTMENT', reference_type = 'STOCK_ADJUSTMENT')
```

- `<StockLedgerDetailModal />` provides instant cross-module navigation buttons to:
  - `/inventory` (Inventory Balances)
  - `/purchasing/receipts` (Purchase Receipts)
  - `/sales/deliveries` (Sales Deliveries)
  - `/purchasing/orders` (Purchase Orders)
  - `/sales/orders` (Sales Orders)

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (22/22 test files passed, 76/76 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.58s)
