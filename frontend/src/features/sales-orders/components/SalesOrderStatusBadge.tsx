import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SalesOrderStatus } from '@/services/salesOrders.service';
import { Clock, CheckCircle2, RefreshCw, Truck, CheckCheck, XCircle } from 'lucide-react';

interface SalesOrderStatusBadgeProps {
  status: SalesOrderStatus | string;
}

export const SalesOrderStatusBadge: React.FC<SalesOrderStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-muted/30 text-muted-foreground">
          <Clock className="h-3 w-3" /> Draft
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge variant="active" className="text-[10px] gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
          <CheckCircle2 className="h-3 w-3" /> Confirmed
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="warning" className="text-[10px] gap-1">
          <RefreshCw className="h-3 w-3 animate-spin-slow" /> Processing
        </Badge>
      );
    case 'shipped':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Truck className="h-3 w-3" /> Shipped
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="active" className="text-[10px] gap-1">
          <CheckCheck className="h-3 w-3" /> Completed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {status}
        </Badge>
      );
  }
};
