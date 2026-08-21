import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseSummaryData } from '../types/dashboard.types';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '@/lib/utils/formatters';

interface PurchaseOverviewWidgetProps {
  data?: PurchaseSummaryData;
  isLoading?: boolean;
  isError?: boolean;
}

export const PurchaseOverviewWidget: React.FC<PurchaseOverviewWidgetProps> = ({
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
          <CardTitle className="text-sm font-semibold">Purchase Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load purchase order metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevation-sm flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-purple-500" /> Purchasing & Goods Receipts
          </CardTitle>
          <CardDescription className="text-xs">Supplier order processing status</CardDescription>
        </div>
        <Link to="/purchasing/orders" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Purchases <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-lg bg-surface border">
          <div>
            <div className="text-[11px] text-muted-foreground">Total POs</div>
            <div className="text-lg font-bold font-mono text-foreground">{formatNumber(data.totalOrders)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Draft / Pending</div>
            <div className="text-lg font-bold font-mono text-amber-500">{formatNumber(data.pendingCount)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Approved</div>
            <div className="text-lg font-bold font-mono text-blue-500">{formatNumber(data.approvedCount)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Received</div>
            <div className="text-lg font-bold font-mono text-emerald-500">{formatNumber(data.receivedCount)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
