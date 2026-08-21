import React from 'react';
import { Badge } from '@/components/ui/badge';
import { WarehouseStatus } from '@/services/warehouses.service';
import { CheckCircle2, XCircle } from 'lucide-react';

interface WarehouseStatusBadgeProps {
  status: WarehouseStatus | string;
}

export const WarehouseStatusBadge: React.FC<WarehouseStatusBadgeProps> = ({ status }) => {
  if (status === 'active') {
    return (
      <Badge variant="active" className="text-[10px] gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-[10px] gap-1">
      <XCircle className="h-3 w-3" /> Inactive
    </Badge>
  );
};
