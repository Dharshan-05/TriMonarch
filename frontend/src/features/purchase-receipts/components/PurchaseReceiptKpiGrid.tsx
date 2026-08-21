import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PurchaseReceipt } from '@/services/purchaseReceipts.service';
import { PackageCheck, Clock, CheckCircle2, CheckCheck } from 'lucide-react';

interface PurchaseReceiptKpiGridProps {
  receipts: PurchaseReceipt[];
  totalRecords: number;
}

export const PurchaseReceiptKpiGrid: React.FC<PurchaseReceiptKpiGridProps> = ({ receipts, totalRecords }) => {
  let draftCount = 0;
  let postedCount = 0;
  let completedCount = 0;

  receipts.forEach((r) => {
    if (r.status === 'draft') draftCount++;
    else if (r.status === 'posted') postedCount++;
    else if (r.status === 'completed') completedCount++;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Goods Receipts</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <PackageCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Draft Receipts</p>
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
            <p className="text-xs font-medium text-muted-foreground">Posted (Stock Received)</p>
            <h4 className="text-xl font-bold font-mono text-blue-600 mt-1">{postedCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Completed Receipts</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{completedCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
