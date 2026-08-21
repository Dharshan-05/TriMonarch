# Warehouse Management UI Architecture & Documentation

## Overview

The Warehouse Management module provides a production-grade enterprise interface for centralized visibility, creation, parameter updates, and supply chain tracking of physical storage facilities and fulfillment hubs across the Mini ERP.

---

## 1. Feature Architecture

Located within `frontend/src/features/warehouses/`:

```
src/features/warehouses/
├── components/
│   ├── WarehouseKpiGrid.tsx             # Summary metric cards (Total Facilities, Active Facilities, Inactive Facilities, Locations Defined)
│   ├── WarehouseToolbar.tsx             # Search input, facility status filter, reset filter, & + Add Warehouse trigger
│   ├── WarehouseTable.tsx               # High-density facility table with monospace codes & location references
│   ├── WarehouseStatusBadge.tsx         # Status badge component for active/inactive states
│   ├── WarehouseDetailModal.tsx         # Profile inspector modal with cross-module deep links
│   ├── CreateWarehouseModal.tsx         # Dialog for registering new warehouse storage locations
│   └── EditWarehouseModal.tsx           # Dialog for updating facility name, location address, and status
├── hooks/
│   └── useWarehouses.ts                 # TanStack Query query hooks and facility mutations
├── types/
│   └── warehouse.types.ts               # Filter state and facility status models
└── pages/
    └── WarehousesPage.tsx               # Page controller mounted at /warehouses and /inventory/warehouses
```

---

## 2. API Contract & Integration

Base path: `/api/v1/warehouses` (Authenticated)

- **List Warehouses**: `GET /api/v1/warehouses` (Permission: `inventory:read`, Query params: `page`, `pageSize`, `search`, `status`, `sortBy`, `sortOrder`)
- **Get Warehouse Detail**: `GET /api/v1/warehouses/:id` (Permission: `inventory:read`)
- **Create Warehouse**: `POST /api/v1/warehouses` (Permission: `inventory:write`, Body: `{ code, name, location?, status? }`)
- **Update Warehouse**: `PATCH /api/v1/warehouses/:id` (Permission: `inventory:write`, Body: `{ name?, location?, status? }`)
- **Immutability Rules**: Warehouse `code` is immutable once registered to prevent breaking physical location references across Stock Ledger, Inventory, and Goods Receipts.

---

## 3. RBAC & Access Control

- Governed by permissions:
  - `inventory:read`: View warehouse facilities, KPI grid, and detailed profile inspectors.
  - `inventory:write`: Register new warehouses and update operational parameters.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `MANAGER`: Read & write access
  - `EMPLOYEE`: Read & write access
  - `AUDITOR`: Read-only audit access

---

## 4. Cross-Module Supply Chain Integration

```
Warehouse Facility (active) ──→ Inventory Balances (/inventory?warehouseId=...)
Warehouse Facility (active) ──→ Stock Ledger Movement (/stock-ledger?warehouseId=...)
Warehouse Facility (active) ──→ Purchase Receipts (/purchasing/receipts?warehouseId=...)
Warehouse Facility (active) ──→ Sales Deliveries (/sales/deliveries?warehouseId=...)
```

- `<WarehouseDetailModal />` provides instant cross-module deep-linking buttons to:
  - `/inventory?warehouseId=...` (Inventory stock balances)
  - `/stock-ledger?warehouseId=...` (Movement audit history)
  - `/purchasing/receipts?warehouseId=...` (Warehouse goods receipts)
  - `/sales/deliveries?warehouseId=...` (Outbound sales deliveries)

---

## 5. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (23/23 test files passed, 80/80 tests passed)
- **Vite Build**: `npm run build` (Clean production bundle built in 5.84s)
