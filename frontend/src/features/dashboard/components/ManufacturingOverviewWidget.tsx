import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ManufacturingSummaryData } from '../types/dashboard.types';
import { Factory, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '@/lib/utils/formatters';

interface ManufacturingOverviewWidgetProps {
  data?: ManufacturingSummaryData;
  isLoading?: boolean;
  isError?: boolean;
}

export const ManufacturingOverviewWidget: React.FC<ManufacturingOverviewWidgetProps> = ({
  data,
  isLoading = false,
  isError = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-elevation-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="shadow-elevation-sm border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Manufacturing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load work order metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevation-sm flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Factory className="h-4 w-4 text-indigo-500" /> Manufacturing Work Orders
          </CardTitle>
          <CardDescription className="text-xs">Shop-floor production pipeline</CardDescription>
        </div>
        <Link to="/manufacturing/orders" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Manufacturing <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-lg bg-surface border">
          <div>
            <div className="text-[11px] text-muted-foreground">Work Orders</div>
            <div className="text-lg font-bold font-mono text-foreground">{formatNumber(data.totalOrders)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">In Progress</div>
            <div className="text-lg font-bold font-mono text-indigo-500">{formatNumber(data.activeCount)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Planned</div>
            <div className="text-lg font-bold font-mono text-amber-500">{formatNumber(data.pendingCount)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Completed</div>
            <div className="text-lg font-bold font-mono text-emerald-500">{formatNumber(data.completedCount)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
