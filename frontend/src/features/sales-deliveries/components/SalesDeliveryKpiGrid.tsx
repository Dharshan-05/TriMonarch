import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SalesDelivery } from '@/services/salesDeliveries.service';
import { Truck, Clock, PackageCheck, CheckCheck } from 'lucide-react';

interface SalesDeliveryKpiGridProps {
  deliveries: SalesDelivery[];
  totalRecords: number;
}

export const SalesDeliveryKpiGrid: React.FC<SalesDeliveryKpiGridProps> = ({ deliveries, totalRecords }) => {
  let pendingCount = 0;
  let inTransitCount = 0;
  let deliveredCount = 0;

  deliveries.forEach((d) => {
    if (d.status === 'draft' || d.status === 'confirmed' || d.status === 'picking' || d.status === 'packed') {
      pendingCount++;
    } else if (d.status === 'shipped') {
      inTransitCount++;
    } else if (d.status === 'delivered') {
      deliveredCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Deliveries</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fulfillment In-Progress</p>
            <h4 className="text-xl font-bold font-mono text-amber-600 mt-1">{pendingCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">In Transit / Shipped</p>
            <h4 className="text-xl font-bold font-mono text-indigo-600 mt-1">{inTransitCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <PackageCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Delivered / Completed</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{deliveredCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
