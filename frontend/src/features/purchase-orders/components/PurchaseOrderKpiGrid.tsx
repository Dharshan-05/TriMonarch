import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PurchaseOrder } from '@/services/purchaseOrders.service';
import { ShoppingBag, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface PurchaseOrderKpiGridProps {
  orders: PurchaseOrder[];
  totalRecords: number;
}

export const PurchaseOrderKpiGrid: React.FC<PurchaseOrderKpiGridProps> = ({ orders, totalRecords }) => {
  let draftCount = 0;
  let approvedCount = 0;
  let totalProcurementValue = 0;

  orders.forEach((po) => {
    const val = parseFloat(po.total_amount || '0');
    totalProcurementValue += val;

    if (po.status === 'draft') {
      draftCount++;
    } else if (po.status === 'approved' || po.status === 'processing' || po.status === 'submitted') {
      approvedCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Purchase Orders</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Draft Purchase Orders</p>
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
            <p className="text-xs font-medium text-muted-foreground">Approved / Active POs</p>
            <h4 className="text-xl font-bold font-mono text-blue-600 mt-1">{approvedCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Procurement Value</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{formatCurrency(totalProcurementValue)}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
