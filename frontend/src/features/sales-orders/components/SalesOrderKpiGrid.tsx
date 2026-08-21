import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SalesOrder } from '@/services/salesOrders.service';
import { ShoppingCart, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface SalesOrderKpiGridProps {
  orders: SalesOrder[];
  totalRecords: number;
}

export const SalesOrderKpiGrid: React.FC<SalesOrderKpiGridProps> = ({ orders, totalRecords }) => {
  let draftCount = 0;
  let activeCount = 0;
  let pipelineValue = 0;

  orders.forEach((ord) => {
    const val = parseFloat(ord.total_amount || '0');
    pipelineValue += val;

    if (ord.status === 'draft') {
      draftCount++;
    } else if (ord.status === 'confirmed' || ord.status === 'processing' || ord.status === 'shipped') {
      activeCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Sales Orders</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Draft Orders</p>
            <h4 className="text-xl font-bold font-mono text-amber-600 mt-1">{draftCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active / Processing</p>
            <h4 className="text-xl font-bold font-mono text-blue-600 mt-1">{activeCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Order Value</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{formatCurrency(pipelineValue)}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
