# Audit Log Management UI Architecture & Documentation

## Overview

The Audit Log Management module provides an enterprise-grade compliance, security, and operational audit console for the Mini ERP frontend. It enables authorized system administrators, compliance officers, and auditors to inspect system events, security alerts, actor operations, and before/after resource state snapshots across all master-data and transaction domains.

---

## 1. Feature Architecture

Located within `frontend/src/features/audit-logs/`:

```
src/features/audit-logs/
├── components/
│   ├── AuditLogKpiGrid.tsx             # Summary KPI cards (Total Events, Create Operations, State Mutations, Auth Alerts)
│   ├── AuditLogToolbar.tsx             # Search, Action filter, Entity Type filter, Success Status filter, & Date Range inputs
│   ├── AuditLogTable.tsx               # High-density operational audit table with monospace IDs and action badges
│   ├── AuditLogActionBadge.tsx         # Semantic color-coded badges for CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
│   ├── AuditLogEntityTypeBadge.tsx     # Visual entity badges for PRODUCT, WAREHOUSE, INVENTORY, USER, etc.
│   └── AuditLogDetailModal.tsx         # Inspector modal with before/after state diffs & raw JSON payload copy
├── hooks/
│   └── useAuditLogs.ts                 # TanStack Query query hooks for audit listing, details, stats, and event types
├── types/
│   └── audit-log.types.ts               # Filter state, category, action, and entity type models
└── index.ts
```

---

## 2. API Contract & Backend Mapping

Base path: `/api/v1/audits` (also mounted at `/api/v1/audit`)

- **List Audit Logs**: `GET /api/v1/audits` (Permission: `audit:read`, Query params: `page`, `pageSize`, `search`, `action`, `entity_type`, `entity_id`, `user_id`, `success`, `startDate`, `endDate`, `sortBy`, `sortOrder`)
- **Get Audit Log Detail**: `GET /api/v1/audits/:id` (Permission: `audit:read`)
- **Get Audit Statistics**: `GET /api/v1/audits/stats` (Permission: `audit:read`)
- **Get Event Types**: `GET /api/v1/audits/events` (Permission: `audit:read`)
- **Immutability Guarantee**: Audit log records are strictly append-only and read-only. No POST, PATCH, or DELETE endpoints exist or are rendered in the UI.

---

## 3. RBAC & Access Control

- Governed by permissions:
  - `audit:read`: View audit log listing, KPI cards, filter tools, and detail inspector modal.
  - `audit:export`: Export audit logs to JSON/CSV formats.
  - `audit:manage`: Advanced audit configuration.
- Supported Roles:
  - `SUPER_ADMIN`: Full access
  - `ADMIN`: Full access
  - `AUDITOR`: Full access (`audit:read`, `report:read`)
  - `MANAGER`: Authorized access
  - `EMPLOYEE`: Access restricted by route protection

---

## 4. Verification Pipeline

- **TypeScript**: `npm run typecheck` (0 errors)
- **ESLint**: `npm run lint` (0 errors, 0 warnings)
- **Vitest Unit & Integration**: `npm run test` (All test files passed)
- **Vite Build**: `npm run build` (Clean production bundle)
