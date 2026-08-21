import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrderStatus } from '@/services/purchaseOrders.service';
import { Clock, Send, CheckCircle2, RefreshCw, PackageCheck, CheckCheck, XCircle } from 'lucide-react';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus | string;
}

export const PurchaseOrderStatusBadge: React.FC<PurchaseOrderStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-muted/30 text-muted-foreground">
          <Clock className="h-3 w-3" /> Draft
        </Badge>
      );
    case 'submitted':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20">
          <Send className="h-3 w-3" /> Submitted
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="active" className="text-[10px] gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="warning" className="text-[10px] gap-1">
          <RefreshCw className="h-3 w-3 animate-spin-slow" /> Processing
        </Badge>
      );
    case 'partially_received':
      return (
        <Badge variant="warning" className="text-[10px] gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
          <PackageCheck className="h-3 w-3" /> Partial Receipt
        </Badge>
      );
    case 'received':
    case 'completed':
      return (
        <Badge variant="active" className="text-[10px] gap-1">
          <CheckCheck className="h-3 w-3" /> {status === 'completed' ? 'Completed' : 'Received'}
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
