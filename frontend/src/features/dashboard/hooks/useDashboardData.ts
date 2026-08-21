import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  inventory: () => [...dashboardKeys.all, 'inventory'] as const,
  sales: () => [...dashboardKeys.all, 'sales'] as const,
  purchases: () => [...dashboardKeys.all, 'purchases'] as const,
  manufacturing: () => [...dashboardKeys.all, 'manufacturing'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  counts: () => [...dashboardKeys.all, 'counts'] as const,
};

export const useDashboardInventoryQuery = () => {
  const { hasPermission } = useAuthorization();
  return useQuery({
    queryKey: dashboardKeys.inventory(),
    queryFn: () => dashboardService.getInventoryHealth(),
    enabled: hasPermission('inventory:read'),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardSalesQuery = () => {
  const { hasPermission } = useAuthorization();
  return useQuery({
    queryKey: dashboardKeys.sales(),
    queryFn: () => dashboardService.getSalesSummary(),
    enabled: hasPermission('sales_order:read'),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardPurchaseQuery = () => {
  const { hasPermission } = useAuthorization();
  return useQuery({
    queryKey: dashboardKeys.purchases(),
    queryFn: () => dashboardService.getPurchaseSummary(),
    enabled: hasPermission('purchase_order:read'),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardManufacturingQuery = () => {
  const { hasPermission } = useAuthorization();
  return useQuery({
    queryKey: dashboardKeys.manufacturing(),
    queryFn: () => dashboardService.getManufacturingSummary(),
    enabled: hasPermission('manufacturing_order:read'),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardActivityQuery = () => {
  const { hasPermission } = useAuthorization();
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: () => dashboardService.getRecentActivity(),
    enabled: hasPermission('audit:read'),
    staleTime: 1 * 60 * 1000,
  });
};

export const useDashboardCountsQuery = () => {
  return useQuery({
    queryKey: dashboardKeys.counts(),
    queryFn: async () => {
      const [productsCount, usersCount] = await Promise.all([
        dashboardService.getProductsCount(),
        dashboardService.getUsersCount(),
      ]);
      return { productsCount, usersCount };
    },
    staleTime: 5 * 60 * 1000,
  });
};
