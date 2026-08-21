# Purchase Order Management UI Architecture & Documentation

## Overview

The Purchase Order module provides a production-grade enterprise interface for issuing, inspecting, editing, submitting, approving, and cancelling supplier purchase orders, managing order lines, and calculating precise procurement totals.

---

## 1. Feature Architecture

Located within `frontend/src/features/purchase-orders/`:

```
src/features/purchase-orders/
├── components/
│   ├── PurchaseOrderKpiGrid.tsx        # Summary metric cards (Total, Draft, Approved, Procurement Value)
│   ├── PurchaseOrderToolbar.tsx        # Search input, status filter select, reset filter, + Create Order trigger
│   ├── PurchaseOrderTable.tsx          # High-density purchase order table with semantic status badges & actions
│   ├── PurchaseOrderStatusBadge.tsx    # Status visualization badges
│   ├── PurchaseOrderLineEditor.tsx     # Dynamic line item builder with unit cost & tax math
│   ├── CreatePurchaseOrderModal.tsx    # Dialog for constructing purchase orders with line items
│   ├── EditPurchaseOrderModal.tsx      # Dialog for updating draft order parameters
│   ├── PurchaseOrderDetailModal.tsx    # Structured summary profile inspector for orders & items
│   └── CancelPurchaseOrderModal.tsx    # Order cancellation dialog
├── hooks/
│   └── usePurchaseOrders.ts            # TanStack Query query hooks and status mutations
├── types/
│   └── purchase-orders.types.ts        # Filter states and draft purchase line models
└── pages/
    └── PurchaseOrdersPage.tsx          # Page controller mounted at /purchasing/orders and /purchase-orders
```

---

## 2. API Contract & Integration

Base path: `/api/v1/purchase-orders` (Authenticated)

- **List Purchase Orders**: `GET /api/v1/purchase-orders` (Permission: `purchase_order:read`)
- **Get Order Details**: `GET /api/v1/purchase-orders/:id` (Permission: `purchase_order:read`)
- **Create Order**: `POST /api/v1/purchase-orders` (Permission: `purchase_order:write`)
- **Update Order**: `PATCH /api/v1/purchase-orders/:id` (Permission: `purchase_order:write`)
- **Status Transition**: `PATCH /api/v1/purchase-orders/:id/status` (Permission: `purchase_order:write`)
- **State Transition Shortcuts**:
  - Submit: `POST /api/v1/purchase-orders/:id/submit` (Permission: `purchase_order:write`)
  - Approve: `POST /api/v1/purchase-orders/:id/approve` (Permission: `purchase_order:approve`)
  - Cancel: `POST /api/v1/purchase-orders/:id/cancel` (Permission: `purchase_order:write`)
- **Delete Order**: `DELETE /api/v1/purchase-orders/:id` (Permission: `purchase_order:delete`)
- **Line Items API**: `POST /api/v1/purchase-orders/:id/items`, `PATCH /api/v1/purchase-orders/:id/items/:itemId`, `DELETE /api/v1/purchase-orders/:id/items/:itemId`

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`), unit costs (`unit_cost`), tax rates (`tax_rate`), tax amounts (`tax_amount`), subtotal (`subtotal`), and total amount (`total_amount`) are transmitted and managed as string-encoded decimals (e.g., `'20.0000'`, `'2360.0000'`).
- UI numeric columns apply `tabular-nums` CSS and `formatCurrency` to eliminate floating-point representation loss.

---

## 4. RBAC & Access Control

- Governed by permissions:
  - `purchase_order:read`: View purchase orders, KPI metrics, and summary profiles.
  - `purchase_order:write`: Create orders, edit draft orders, and trigger submit/cancel transitions.
  - `purchase_order:approve`: Approve submitted purchase orders.
  - `purchase_order:delete`: Delete draft purchase orders.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read & write & approve access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only access

---

## 5. Order Lifecycle & Cache Invalidation

- **State Machine Transitions**: `draft` → `submitted` → `approved` → `processing` → `partially_received` / `received` / `completed` / `cancelled`.
- Executing status mutations invalidates:
  - `queryKeys.purchaseOrders.all`
  - `queryKeys.purchaseOrders.detail(id)`
  - `queryKeys.inventory.all` (upon approval & receipt)

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (21/21 test files passed, 72/72 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.58s)
