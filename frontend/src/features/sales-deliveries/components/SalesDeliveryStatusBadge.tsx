import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SalesDeliveryStatus } from '@/services/salesDeliveries.service';
import { Clock, CheckCircle, PackageSearch, PackageCheck, Truck, CheckCheck, XCircle } from 'lucide-react';

interface SalesDeliveryStatusBadgeProps {
  status: SalesDeliveryStatus | string;
}

export const SalesDeliveryStatusBadge: React.FC<SalesDeliveryStatusBadgeProps> = ({ status }) => {
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
          <CheckCircle className="h-3 w-3" /> Confirmed
        </Badge>
      );
    case 'picking':
      return (
        <Badge variant="warning" className="text-[10px] gap-1">
          <PackageSearch className="h-3 w-3" /> Picking
        </Badge>
      );
    case 'packed':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <PackageCheck className="h-3 w-3" /> Packed
        </Badge>
      );
    case 'shipped':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">
          <Truck className="h-3 w-3" /> Shipped
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="active" className="text-[10px] gap-1">
          <CheckCheck className="h-3 w-3" /> Delivered
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
