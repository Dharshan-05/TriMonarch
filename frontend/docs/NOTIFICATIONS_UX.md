# Phase 099 — Notifications & UX Architecture & Standards

## Overview

Phase 099 establishes a **production-grade, enterprise-level notification and UX feedback system** across the TriMonarch Mini ERP frontend without modifying business workflows or breaking existing RBAC security boundaries.

---

## 1. Centralized Notification Architecture

Located within `frontend/src/features/notifications/`:

```
src/features/notifications/
├── context/
│   └── ToastContext.tsx          # Toast state management & notify helper API
├── components/
│   └── ToastContainer.tsx        # Floating viewport overlay with accessibility & semantic styling
└── index.ts                      # Barrel re-export
```

### Global Provider Setup

Mounted at root in [`AppProvider.tsx`](file:///d:/PROJECT/ERP/frontend/src/app/providers/AppProvider.tsx):

```tsx
<ErrorBoundary>
  <QueryProvider>
    <AuthProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  </QueryProvider>
</ErrorBoundary>
```

### Developer Usage API

Access via `useToast()` hook or `@/components/ui/toast`:

```ts
import { useToast } from '@/components/ui/toast';

const { notify } = useToast();

// Success Notification
notify.success('Product created successfully.', 'Product Created');

// Error Notification
notify.error('Unable to save changes due to validation errors.', 'Validation Error');

// Warning Notification
notify.warning('Low inventory stock level detected.', 'Stock Warning');

// Information Notification
notify.info('System maintenance scheduled for tonight.', 'Notice');
```

---

## 2. API Error Normalization Strategy

Located in [`src/lib/api/error-formatter.ts`](file:///d:/PROJECT/ERP/frontend/src/lib/api/error-formatter.ts).

All HTTP errors are mapped into clean, human-readable enterprise messaging:

| HTTP Code | Error Title | Default Human-Readable Message |
| :--- | :--- | :--- |
| `400` | Invalid Request | Parameters or payload submitted are invalid. |
| `401` | Authentication Required | Your session has expired or is invalid. Please sign in again. |
| `403` | Access Denied | You do not have permission to perform this action. |
| `404` | Resource Not Found | The requested resource could not be found. |
| `409` | Conflict Detected | A resource with duplicate unique identifiers already exists. |
| `422` | Validation Error | One or more submitted fields failed validation. |
| `429` | Rate Limit Exceeded | Too many requests sent. Please wait a moment. |
| `500` | Server Error | An unexpected server error occurred. |
| `0` / Net | Connection Unreachable | Unable to communicate with server. Check network connection. |

### Database Leaks & SQL Masking

Raw PostgreSQL error strings, unique constraint syntax warnings, and unhandled stack traces are stripped automatically before rendering to end users.

---

## 3. Reusable UX Primitives

- **Confirmation Modal**: [`<ConfirmationModal />`](file:///d:/PROJECT/ERP/frontend/src/components/ui/confirmation-modal.tsx) for destructive/irreversible actions.
- **Loading State**: [`<LoadingState />`](file:///d:/PROJECT/ERP/frontend/src/components/ui/loading-state.tsx) with `role="status"` and accessible screen-reader text.
- **Error State**: [`<ErrorState />`](file:///d:/PROJECT/ERP/frontend/src/components/ui/error-state.tsx) with retry handler triggers.
- **Form Skeletons**: [`<Skeleton />`](file:///d:/PROJECT/ERP/frontend/src/components/ui/skeleton.tsx) for content placeholders.

---

## 4. Accessibility & Security Controls

1. **ARIA Roles**: Toast notifications specify `role="status"` for non-critical alerts and `role="alert"` for errors.
2. **Keyboard Accessibility**: Notifications can be dismissed via keyboard or close button without stealing focus.
3. **Double Submission Safety**: Buttons are disabled during pending loading states (`disabled={isLoading}`).
4. **Read-Only Audit Logs**: Phase 098 Audit Logs remain strictly read-only (`audit:read`) without mutation actions or toast triggers.

---

## 5. Verification Pipeline

- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run test`: 25 test files passed, 91 tests passed
- `npm run build`: Production Vite bundle succeeded
