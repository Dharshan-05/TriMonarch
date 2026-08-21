import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/auth-context';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import {
  useDashboardInventoryQuery,
  useDashboardSalesQuery,
  useDashboardPurchaseQuery,
  useDashboardManufacturingQuery,
  useDashboardActivityQuery,
  useDashboardCountsQuery,
  dashboardKeys,
} from '@/features/dashboard/hooks/useDashboardData';
import { KpiGrid } from '@/features/dashboard/components/KpiGrid';
import { AttentionAlerts } from '@/features/dashboard/components/AttentionAlerts';
import { InventoryHealthWidget } from '@/features/dashboard/components/InventoryHealthWidget';
import { SalesOverviewWidget } from '@/features/dashboard/components/SalesOverviewWidget';
import { PurchaseOverviewWidget } from '@/features/dashboard/components/PurchaseOverviewWidget';
import { ManufacturingOverviewWidget } from '@/features/dashboard/components/ManufacturingOverviewWidget';
import { RecentActivityWidget } from '@/features/dashboard/components/RecentActivityWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, RefreshCw, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { roles, hasPermission } = useAuthorization();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const primaryRole = roles[0] || 'ADMIN';

  // Parallel dashboard queries
  const countsQuery = useDashboardCountsQuery();
  const inventoryQuery = useDashboardInventoryQuery();
  const salesQuery = useDashboardSalesQuery();
  const purchaseQuery = useDashboardPurchaseQuery();
  const manufacturingQuery = useDashboardManufacturingQuery();
  const activityQuery = useDashboardActivityQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isKpiLoading = countsQuery.isLoading || inventoryQuery.isLoading || salesQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-primary" /> Enterprise Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.email || 'User'}</span>. Operational status overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border px-3 py-1.5 rounded-lg shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Session Role:</span>
            <Badge variant="active" className="text-xs font-mono uppercase">
              {primaryRole}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Grid Section */}
      <KpiGrid
        productsCount={countsQuery.data?.productsCount}
        lowStockCount={inventoryQuery.data?.lowStockCount}
        pendingSalesCount={salesQuery.data?.pendingCount}
        pendingPurchaseCount={purchaseQuery.data?.pendingCount}
        activeManufacturingCount={manufacturingQuery.data?.activeCount}
        usersCount={countsQuery.data?.usersCount}
        isLoading={isKpiLoading}
      />

      {/* Inventory Exception Alerts */}
      {hasPermission('inventory:read') && inventoryQuery.data && (
        <AttentionAlerts
          outOfStockCount={inventoryQuery.data.outOfStockCount}
          lowStockCount={inventoryQuery.data.lowStockCount}
          lowStockItems={inventoryQuery.data.lowStockItems}
        />
      )}

      {/* Main Operational Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Health Widget */}
        {hasPermission('inventory:read') && (
          <InventoryHealthWidget
            data={inventoryQuery.data}
            isLoading={inventoryQuery.isLoading}
            isError={inventoryQuery.isError}
          />
        )}

        {/* Sales Overview Widget */}
        {hasPermission('sales_order:read') && (
          <SalesOverviewWidget
            data={salesQuery.data}
            isLoading={salesQuery.isLoading}
            isError={salesQuery.isError}
          />
        )}

        {/* Purchase Overview Widget */}
        {hasPermission('purchase_order:read') && (
          <PurchaseOverviewWidget
            data={purchaseQuery.data}
            isLoading={purchaseQuery.isLoading}
            isError={purchaseQuery.isError}
          />
        )}

        {/* Manufacturing Overview Widget */}
        {hasPermission('manufacturing_order:read') && (
          <ManufacturingOverviewWidget
            data={manufacturingQuery.data}
            isLoading={manufacturingQuery.isLoading}
            isError={manufacturingQuery.isError}
          />
        )}
      </div>

      {/* Recent Operational Activity Log Stream */}
      {hasPermission('audit:read') && (
        <RecentActivityWidget
          items={activityQuery.data}
          isLoading={activityQuery.isLoading}
          isError={activityQuery.isError}
        />
      )}
    </div>
  );
};
