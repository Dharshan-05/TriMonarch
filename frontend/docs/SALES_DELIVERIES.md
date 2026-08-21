# Sales Delivery UI Architecture & Documentation

## Overview

The Sales Delivery module provides a production-grade operational fulfillment management interface for processing customer delivery dispatches after sales order confirmation, tracking picking/packing/shipping milestones, and recording inventory stock ledger deduction movements.

---

## 1. Feature Architecture

Located within `frontend/src/features/sales-deliveries/`:

```
src/features/sales-deliveries/
├── components/
│   ├── SalesDeliveryKpiGrid.tsx        # Summary metric cards (Total, In-Progress, In Transit, Delivered)
│   ├── SalesDeliveryToolbar.tsx        # Search input, status filter select, reset filter, + Create Delivery trigger
│   ├── SalesDeliveryTable.tsx          # High-density delivery dispatch table with step buttons & badges
│   ├── SalesDeliveryStatusBadge.tsx    # Status visualization badges
│   ├── SalesDeliveryItemsTable.tsx     # Delivered item breakdown with SKU & quantity columns
│   ├── CreateSalesDeliveryModal.tsx    # Dialog for initiating delivery dispatches against confirmed orders
│   ├── SalesDeliveryDetailModal.tsx    # Structured inspector for delivery dispatches & cross-module links
│   └── CancelSalesDeliveryModal.tsx    # Dialog for cancelling delivery dispatches
├── hooks/
│   └── useSalesDeliveries.ts           # TanStack Query query hooks and status mutations
├── types/
│   └── sales-deliveries.types.ts       # Filter state and draft delivery models
└── pages/
    └── SalesDeliveriesPage.tsx         # Page controller mounted at /sales/deliveries and /sales-deliveries
```

---

## 2. API Contract & Integration

Base path: `/api/v1/deliveries` (Authenticated)

- **List Deliveries**: `GET /api/v1/deliveries` (Query params: `page`, `pageSize`, `query`, `salesOrderId`, `warehouseId`, `status`, `sortBy`, `sortOrder`)
- **Get Delivery Details**: `GET /api/v1/deliveries/:id`
- **Create Delivery**: `POST /api/v1/deliveries` (Body: `sales_order_id`, `warehouse_id`, `delivery_number`, `delivery_date`, `notes`)
- **Add Delivery Item**: `POST /api/v1/deliveries/:id/items` (Body: `sales_order_item_id`, `product_id`, `quantity`)
- **Remove Delivery Item**: `DELETE /api/v1/deliveries/:id/items/:itemId`
- **State Machine Transitions**:
  - Confirm: `POST /api/v1/deliveries/:id/confirm`
  - Start Picking: `POST /api/v1/deliveries/:id/picking`
  - Mark Packed: `POST /api/v1/deliveries/:id/pack`
  - Ship Dispatch: `POST /api/v1/deliveries/:id/ship`
  - Deliver Dispatch: `POST /api/v1/deliveries/:id/deliver` (Triggers inventory deduct & stock ledger entry)
  - Cancel Dispatch: `POST /api/v1/deliveries/:id/cancel`

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`, `ordered_quantity`, `delivered_quantity`, `pending_quantity`) are preserved and passed as string-encoded decimals (e.g. `'10.0000'`, `'100.0000'`).
- UI table columns apply `font-mono`, `tabular-nums`, and `formatNumber` to eliminate floating-point representation errors.

---

## 4. RBAC & Access Control

- Governed by sales permissions (`sales_order:read` for viewing, `sales_order:write` for dispatch creation & status transitions).
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read & write access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only access

---

## 5. Inventory & Sales Order Integration

- Executing `deliverDelivery` mutation automatically invalidates:
  - `queryKeys.salesDeliveries.all`
  - `queryKeys.salesOrders.all`
  - `queryKeys.inventory.all`
  - `queryKeys.stockLedger.all`
- `<SalesDeliveryDetailModal />` provides direct deep-linking buttons to `/sales/orders` and `/stock-ledger`.

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (20/20 test files passed, 68/68 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.91s)
