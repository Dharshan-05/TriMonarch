import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PurchaseReceiptStatus } from '@/services/purchaseReceipts.service';
import { Clock, PackageCheck, CheckCheck, XCircle } from 'lucide-react';

interface PurchaseReceiptStatusBadgeProps {
  status: PurchaseReceiptStatus | string;
}

export const PurchaseReceiptStatusBadge: React.FC<PurchaseReceiptStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-muted/30 text-muted-foreground">
          <Clock className="h-3 w-3" /> Draft
        </Badge>
      );
    case 'posted':
      return (
        <Badge variant="active" className="text-[10px] gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
          <PackageCheck className="h-3 w-3" /> Posted (In Stock)
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
