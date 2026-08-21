# Inventory Management UI Architecture & Documentation

## Overview

The Inventory Management module provides a production-grade enterprise interface for monitoring physical stock balances, product/SKU availability across warehouses, reorder threshold alerts, stock adjustment transactions, and deep cross-module integration with Sales Deliveries, Purchase Goods Receipts, and the Stock Ledger.

---

## 1. Feature Architecture

Located within `frontend/src/features/inventory/`:

```
src/features/inventory/
├── components/
│   ├── InventoryKpiGrid.tsx              # Summary metric cards (Total Entries, Sufficient Stock, Low Stock Warnings, Out of Stock)
│   ├── InventoryToolbar.tsx              # Search input, stock level filter select, reset filter, + Create Stock Entry trigger
│   ├── InventoryTable.tsx                # High-density inventory table with status badges & movement history links
│   ├── InventoryDetailModal.tsx          # Summary profile inspector with cross-module deep links
│   ├── AdjustStockModal.tsx              # Stock adjustment transaction dialog
│   ├── CreateInventoryModal.tsx          # Dialog for establishing new stock records
│   ├── EditInventoryModal.tsx            # Dialog for updating reorder thresholds
│   └── ConfirmDeleteInventoryModal.tsx   # Confirmation dialog for removing inventory entries
├── hooks/
│   └── useInventory.ts                  # TanStack Query query hooks and stock adjustment mutations
├── types/
│   └── inventory.types.ts                # Filter state and stock status models
└── pages/
    └── InventoryPage.tsx                # Page controller mounted at /inventory
```

---

## 2. API Contract & Integration

Base path: `/api/v1/inventory` (Authenticated)

- **List Inventory**: `GET /api/v1/inventory` (Permission: `inventory:read`, Query params: `page`, `pageSize`, `query`, `search`, `productId`, `warehouseId`, `status`, `sortBy`, `sortOrder`)
- **Get Inventory Record**: `GET /api/v1/inventory/:id` (Permission: `inventory:read`)
- **Create Stock Entry**: `POST /api/v1/inventory` (Permission: `inventory:write`)
- **Update Stock Entry**: `PATCH /api/v1/inventory/:id` (Permission: `inventory:write`)
- **Adjust Stock**: `PATCH /api/v1/inventory/:id/adjust` (Permission: `inventory:adjust` or `inventory:write`, Body: `{ delta_quantity, reason, notes, reference_type, reference_id }`)
- **Delete Stock Entry**: `DELETE /api/v1/inventory/:id` (Permission: `inventory:delete`)
- **List Stock Movements**: `GET /api/v1/inventory/:id/movements` (Permission: `inventory:read`)

---

## 3. Financial & Quantity Precision Strategy

- Quantities (`quantity`, `reorder_level`) are preserved and transmitted as string-encoded decimals (e.g., `'500.0000'`, `'50.0000'`).
- UI numeric columns apply `tabular-nums` CSS class and `formatNumber` to eliminate floating-point representation loss.

---

## 4. RBAC & Access Control

- Governed by permissions:
  - `inventory:read`: View inventory balances, KPI grid, and detailed profile inspectors.
  - `inventory:write`: Create inventory records and update reorder thresholds.
  - `inventory:adjust`: Perform manual stock adjustment transactions.
  - `inventory:delete`: Delete unreferenced inventory entries.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read, write, & adjust access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only access

---

## 5. Cross-Module Operational Workflows

```
Purchase Receipt Posted
       ↓
Inventory (+quantity) & Stock Ledger (IN)
       ↓
Sales Delivery Completed
       ↓
Inventory (-quantity) & Stock Ledger (OUT)
```

- Executing `adjustStock`, `postReceipt`, or `deliverDelivery` automatically invalidates:
  - `queryKeys.inventory.all`
  - `queryKeys.stockLedger.all`
  - `queryKeys.dashboard.all`
- `<InventoryDetailModal />` provides direct deep-linking buttons to `/stock-ledger`, `/purchasing/receipts`, and `/sales/deliveries`.

---

## 6. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (22/22 test files passed, 76/76 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 6.56s)
