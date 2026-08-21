import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StockLedgerEntry } from '@/services/stockLedger.service';
import { History, ArrowDownRight, ArrowUpRight, Sliders } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';

interface StockLedgerKpiGridProps {
  entries: StockLedgerEntry[];
  totalRecords: number;
}

export const StockLedgerKpiGrid: React.FC<StockLedgerKpiGridProps> = ({ entries, totalRecords }) => {
  let incomingVolume = 0;
  let outgoingVolume = 0;
  let adjustmentCount = 0;

  entries.forEach((item) => {
    const qty = parseFloat(item.quantity || '0');
    if (item.movement_type === 'IN' || item.movement_type === 'TRANSFER_IN' || qty > 0) {
      if (item.movement_type === 'ADJUSTMENT') {
        adjustmentCount++;
      } else {
        incomingVolume += Math.abs(qty);
      }
    } else if (item.movement_type === 'OUT' || item.movement_type === 'TRANSFER_OUT' || qty < 0) {
      if (item.movement_type === 'ADJUSTMENT') {
        adjustmentCount++;
      } else {
        outgoingVolume += Math.abs(qty);
      }
    } else if (item.movement_type === 'ADJUSTMENT') {
      adjustmentCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Movement Records</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <History className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Stock Intake Volume (+)</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{formatNumber(incomingVolume)}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <ArrowDownRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Stock Outflow Volume (-)</p>
            <h4 className="text-xl font-bold font-mono text-red-600 mt-1">{formatNumber(outgoingVolume)}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Audit Adjustments</p>
            <h4 className="text-xl font-bold font-mono text-amber-600 mt-1">{adjustmentCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sliders className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
