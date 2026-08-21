# Sales Order Management UI Architecture & Documentation

## Overview

The Sales Order module provides a production-grade enterprise management interface for issuing, inspecting, editing, confirming, and cancelling customer sales orders, managing order lines, and calculating precise financial totals.

---

## 1. Feature Architecture

Located within `frontend/src/features/sales-orders/`:

```
src/features/sales-orders/
├── components/
│   ├── SalesOrderKpiGrid.tsx        # Operational summary metric cards (Total, Draft, Active, Total Value)
│   ├── SalesOrderToolbar.tsx        # Search input, status dropdown, reset filter, + Create Order trigger
│   ├── SalesOrderTable.tsx          # High-density sales order table with semantic status badges & actions
│   ├── SalesOrderStatusBadge.tsx    # Status visualization badges
│   ├── SalesOrderLineEditor.tsx     # Dynamic order line item builder with tax & line total math
│   ├── CreateSalesOrderModal.tsx    # Dialog for constructing sales orders with line items
│   ├── EditSalesOrderModal.tsx      # Dialog for updating draft order parameters
│   ├── SalesOrderDetailModal.tsx    # Structured summary profile inspector for orders & items
│   ├── ConfirmSalesOrderModal.tsx   # Order confirmation dialog
│   └── CancelSalesOrderModal.tsx    # Order cancellation dialog
├── hooks/
│   └── useSalesOrders.ts            # TanStack Query query hooks and mutations
├── types/
│   └── sales-orders.types.ts        # Filter states and draft order line models
└── pages/
    └── SalesOrdersPage.tsx          # Page controller mounted at /sales/orders and /sales-orders
```

---

## 2. API Contract & Integration

- **List Sales Orders**: `GET /api/v1/sales-orders` (Permission: `sales_order:read`)
- **Get Order Details**: `GET /api/v1/sales-orders/:id` (Permission: `sales_order:read`)
- **Create Order**: `POST /api/v1/sales-orders` (Permission: `sales_order:write`)
- **Update Order**: `PATCH /api/v1/sales-orders/:id` (Permission: `sales_order:write`)
- **Status Transition**: `PATCH /api/v1/sales-orders/:id/status` (Permission: `sales_order:write`)
- **Delete Order**: `DELETE /api/v1/sales-orders/:id` (Permission: `sales_order:delete`)
- **Order Lines API**: `POST /api/v1/sales-orders/:id/items`, `PATCH /api/v1/sales-orders/:id/items/:itemId`, `DELETE /api/v1/sales-orders/:id/items/:itemId`

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`), unit prices (`unit_price`), tax rates (`tax_rate`), tax amounts (`tax_amount`), subtotal (`subtotal`), and total amount (`total_amount`) are transmitted and managed as string-encoded decimals (e.g., `'10.0000'`, `'1180.0000'`).
- Prevents floating-point precision degradation across API requests and forms.
- Formatted visually using `tabular-nums` CSS and `formatCurrency` helper.

---

## 4. RBAC & Access Control

- Governed by permissions:
  - `sales_order:read`: View order list, metrics, and summary details.
  - `sales_order:write`: Create orders, edit draft orders, and execute status transitions (confirm/cancel).
  - `sales_order:delete`: Delete draft sales orders.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read & write access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only access

---

## 5. Order Lifecycle & Cache Invalidation

- **State Machine Transitions**: `draft` → `confirmed` → `processing` → `shipped` → `completed` / `cancelled`.
- Executing status mutations invalidates:
  - `queryKeys.salesOrders.all`
  - `queryKeys.salesOrders.detail(id)`
  - `queryKeys.inventory.all` (for stock allocation & reservations)
  - `queryKeys.stockLedger.all` (for audit movement history)

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (19/19 test files passed, 64/64 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.11s)
