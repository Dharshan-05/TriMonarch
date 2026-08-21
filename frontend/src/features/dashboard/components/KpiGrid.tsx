import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Boxes, ShoppingCart, ShoppingBag, Factory, Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';

interface KpiGridProps {
  productsCount?: number;
  lowStockCount?: number;
  pendingSalesCount?: number;
  pendingPurchaseCount?: number;
  activeManufacturingCount?: number;
  usersCount?: number;
  isLoading?: boolean;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
  productsCount = 0,
  lowStockCount = 0,
  pendingSalesCount = 0,
  pendingPurchaseCount = 0,
  activeManufacturingCount = 0,
  usersCount = 0,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-elevation-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      id: 'products',
      title: 'Total Products',
      value: formatNumber(productsCount),
      subtext: 'Catalog SKUs',
      icon: Package,
      color: 'text-primary',
    },
    {
      id: 'low-stock',
      title: 'Low / Out of Stock',
      value: formatNumber(lowStockCount),
      subtext: lowStockCount > 0 ? 'Requires replenishment' : 'Healthy inventory',
      icon: Boxes,
      color: lowStockCount > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500',
    },
    {
      id: 'pending-sales',
      title: 'Pending Sales',
      value: formatNumber(pendingSalesCount),
      subtext: 'Draft / Confirmed orders',
      icon: ShoppingCart,
      color: 'text-blue-500',
    },
    {
      id: 'pending-purchases',
      title: 'Pending Purchases',
      value: formatNumber(pendingPurchaseCount),
      subtext: 'Supplier POs pending',
      icon: ShoppingBag,
      color: 'text-purple-500',
    },
    {
      id: 'active-manufacturing',
      title: 'Active Work Orders',
      value: formatNumber(activeManufacturingCount),
      subtext: 'Shop-floor operations',
      icon: Factory,
      color: 'text-indigo-500',
    },
    {
      id: 'active-users',
      title: 'Active Users',
      value: formatNumber(usersCount),
      subtext: 'Organization accounts',
      icon: Users,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="shadow-elevation-sm transition-all hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 flex-shrink-0 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{card.value}</div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{card.subtext}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
