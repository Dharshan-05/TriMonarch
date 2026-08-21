import { createBrowserRouter } from 'react-router-dom';
import { ApplicationShell } from '@/components/layout/ApplicationShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { StockLedgerPage } from '@/pages/StockLedgerPage';
import { WarehousesPage } from '@/pages/WarehousesPage';
import { SalesOrdersPage } from '@/pages/SalesOrdersPage';
import { SalesDeliveriesPage } from '@/pages/SalesDeliveriesPage';
import { PurchaseOrdersPage } from '@/pages/PurchaseOrdersPage';
import { PurchaseReceiptsPage } from '@/pages/PurchaseReceiptsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { ShowcasePage } from '@/pages/ShowcasePage';
import { LoginPage } from '@/pages/LoginPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthorizationRoute } from '@/components/routing/AuthorizationRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <ApplicationShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            element: <AuthorizationRoute access={{ roles: ['ADMIN', 'SUPER_ADMIN'] }} />,
            children: [
              {
                path: 'users',
                element: <UsersPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['partner:read'] }} />,
            children: [
              {
                path: 'partners',
                element: <PartnersPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['product:read'] }} />,
            children: [
              {
                path: 'products',
                element: <ProductsPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['inventory:read'] }} />,
            children: [
              {
                path: 'inventory',
                element: <InventoryPage />,
              },
              {
                path: 'inventory/ledger',
                element: <StockLedgerPage />,
              },
              {
                path: 'stock-ledger',
                element: <StockLedgerPage />,
              },
              {
                path: 'warehouses',
                element: <WarehousesPage />,
              },
              {
                path: 'inventory/warehouses',
                element: <WarehousesPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['sales_order:read'] }} />,
            children: [
              {
                path: 'sales/orders',
                element: <SalesOrdersPage />,
              },
              {
                path: 'sales-orders',
                element: <SalesOrdersPage />,
              },
              {
                path: 'sales/deliveries',
                element: <SalesDeliveriesPage />,
              },
              {
                path: 'sales-deliveries',
                element: <SalesDeliveriesPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['purchase_order:read'] }} />,
            children: [
              {
                path: 'purchasing/orders',
                element: <PurchaseOrdersPage />,
              },
              {
                path: 'purchase-orders',
                element: <PurchaseOrdersPage />,
              },
              {
                path: 'purchasing/receipts',
                element: <PurchaseReceiptsPage />,
              },
              {
                path: 'purchase-receipts',
                element: <PurchaseReceiptsPage />,
              },
            ],
          },
          {
            element: <AuthorizationRoute access={{ permissions: ['audit:read'] }} />,
            children: [
              {
                path: 'audit',
                element: <AuditLogsPage />,
              },
              {
                path: 'audit-logs',
                element: <AuditLogsPage />,
              },
            ],
          },
          {
            path: 'design-system',
            element: <ShowcasePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
