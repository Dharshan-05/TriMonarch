# Purchase Goods Receipts UI Architecture & Documentation

## Overview

The Purchase Goods Receipts module provides a production-grade warehouse receiving interface for issuing goods receipt dispatches against approved purchase orders, inspecting received line items, posting physical stock additions to inventory, and logging `IN` stock ledger movement entries.

---

## 1. Feature Architecture

Located within `frontend/src/features/purchase-receipts/`:

```
src/features/purchase-receipts/
├── components/
│   ├── PurchaseReceiptKpiGrid.tsx        # Operational summary metric cards (Total, Draft, Posted, Completed)
│   ├── PurchaseReceiptToolbar.tsx        # Search input, status filter select, reset filter, + Receive Goods trigger
│   ├── PurchaseReceiptTable.tsx          # High-density receipt table with status badges & state transition buttons
│   ├── PurchaseReceiptStatusBadge.tsx    # Status visualization badges
│   ├── PurchaseReceiptItemsTable.tsx     # Received line items table displaying SKU, Qty, & Unit Cost
│   ├── CreatePurchaseReceiptModal.tsx    # Dialog for receiving goods against approved purchase orders
│   ├── PurchaseReceiptDetailModal.tsx    # Structured summary profile inspector for receipts & lines
│   └── CancelPurchaseReceiptModal.tsx    # Receipt cancellation dialog
├── hooks/
│   └── usePurchaseReceipts.ts            # TanStack Query query hooks and status mutations
├── types/
│   └── purchase-receipts.types.ts        # Filter state and draft receipt line models
└── pages/
    └── PurchaseReceiptsPage.tsx          # Page controller mounted at /purchasing/receipts and /purchase-receipts
```

---

## 2. API Contract & Integration

Base path: `/api/v1/purchase-receipts` (Authenticated)

- **List Purchase Receipts**: `GET /api/v1/purchase-receipts` (Permission: `purchase_order:read`)
- **Get Receipt Details**: `GET /api/v1/purchase-receipts/:id` (Permission: `purchase_order:read`)
- **Create Receipt**: `POST /api/v1/purchase-receipts` (Permission: `purchase_order:write`)
- **Add Receipt Item**: `POST /api/v1/purchase-receipts/:id/items` (Permission: `purchase_order:write`)
- **Update Receipt Item**: `PATCH /api/v1/purchase-receipts/:id/items/:itemId` (Permission: `purchase_order:write`)
- **Remove Receipt Item**: `DELETE /api/v1/purchase-receipts/:id/items/:itemId` (Permission: `purchase_order:write`)
- **State Machine Transitions**:
  - Post Receipt: `POST /api/v1/purchase-receipts/:id/post` (Triggers inventory stock addition & stock ledger IN movement)
  - Complete Receipt: `POST /api/v1/purchase-receipts/:id/complete`
  - Cancel Receipt: `POST /api/v1/purchase-receipts/:id/cancel`

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`, `ordered_quantity`, `received_quantity`, `pending_quantity`) and unit costs (`unit_cost`) are transmitted and preserved as string-encoded decimals (e.g., `'20.0000'`, `'100.0000'`).
- UI numeric columns apply `tabular-nums` CSS and `formatNumber` / `formatCurrency` to eliminate floating-point representation loss.

---

## 4. RBAC & Access Control

- Governed by permissions:
  - `purchase_order:read`: View purchase receipts, KPI metrics, and summary profiles.
  - `purchase_order:write`: Create receipts, post stock additions, complete receipts, and cancel draft receipts.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read & write access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only access

---

## 5. Inventory & Stock Ledger Integration

```
Purchase Order (approved/partially_received)
       ↓
Create Purchase Receipt (draft)
       ↓
Post Receipt (posted)
       ↓
Inventory (+quantity) & Stock Ledger (movement_type = 'IN')
```

- Executing `postReceipt` mutation invalidates:
  - `queryKeys.purchaseReceipts.all`
  - `queryKeys.purchaseReceipts.detail(id)`
  - `queryKeys.purchaseOrders.all`
  - `queryKeys.inventory.all`
  - `queryKeys.stockLedger.all`
- `<PurchaseReceiptDetailModal />` provides direct deep-linking buttons to `/purchasing/orders`, `/inventory`, and `/stock-ledger`.

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (22/22 test files passed, 76/76 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.56s)
