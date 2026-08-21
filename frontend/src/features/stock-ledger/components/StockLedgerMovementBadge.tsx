import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight, Sliders, RefreshCw } from 'lucide-react';
import { StockMovementType } from '@/services/stockLedger.service';

interface StockLedgerMovementBadgeProps {
  type: StockMovementType | string;
}

export const StockLedgerMovementBadge: React.FC<StockLedgerMovementBadgeProps> = ({ type }) => {
  switch (type) {
    case 'IN':
    case 'RECEIPT':
    case 'PURCHASE':
      return (
        <Badge variant="active" className="text-[10px] gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <ArrowDownRight className="h-3 w-3" /> IN
        </Badge>
      );
    case 'OUT':
    case 'ISSUE':
    case 'SALE':
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <ArrowUpRight className="h-3 w-3" /> OUT
        </Badge>
      );
    case 'ADJUSTMENT':
      return (
        <Badge variant="warning" className="text-[10px] gap-1">
          <Sliders className="h-3 w-3" /> ADJUSTMENT
        </Badge>
      );
    case 'TRANSFER_IN':
    case 'TRANSFER_OUT':
    case 'TRANSFER':
      return (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <RefreshCw className="h-3 w-3" /> {type.replace('_', ' ')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {type}
        </Badge>
      );
  }
};
