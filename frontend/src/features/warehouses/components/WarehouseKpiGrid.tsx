import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Warehouse } from '@/services/warehouses.service';
import { Warehouse as WarehouseIcon, CheckCircle2, XCircle, MapPin } from 'lucide-react';

interface WarehouseKpiGridProps {
  warehouses: Warehouse[];
  totalRecords?: number;
}

export const WarehouseKpiGrid: React.FC<WarehouseKpiGridProps> = ({ warehouses, totalRecords }) => {
  const activeCount = warehouses.filter((w) => w.status === 'active').length;
  const inactiveCount = warehouses.filter((w) => w.status === 'inactive').length;
  const total = totalRecords ?? warehouses.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Facilities
            </span>
            <div className="text-2xl font-bold text-foreground font-mono">{total}</div>
            <span className="text-[11px] text-muted-foreground">Registered Warehouses</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <WarehouseIcon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Warehouses
            </span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{activeCount}</div>
            <span className="text-[11px] text-muted-foreground">Operational Hubs</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Inactive Facilities
            </span>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{inactiveCount}</div>
            <span className="text-[11px] text-muted-foreground">Decommissioned / Paused</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Locations Defined
            </span>
            <div className="text-2xl font-bold text-foreground font-mono">
              {warehouses.filter((w) => Boolean(w.location)).length}
            </div>
            <span className="text-[11px] text-muted-foreground">With Address Metadata</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
