import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Inventory } from '@/services/inventory.service';

interface InventoryKpiGridProps {
  inventoryList: Inventory[];
  totalRecords: number;
}

export const InventoryKpiGrid: React.FC<InventoryKpiGridProps> = ({ inventoryList, totalRecords }) => {
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  inventoryList.forEach((item) => {
    const qty = parseFloat(item.quantity || '0');
    const reorder = parseFloat(item.reorder_level || '0');

    if (qty <= 0) {
      outOfStockCount++;
    } else if (reorder > 0 && qty <= reorder) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Stock Records</p>
            <h4 className="text-xl font-bold font-mono text-foreground mt-1">{totalRecords}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Sufficient Stock</p>
            <h4 className="text-xl font-bold font-mono text-green-600 mt-1">{inStockCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Low Stock Warnings</p>
            <h4 className="text-xl font-bold font-mono text-amber-600 mt-1">{lowStockCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Out of Stock Items</p>
            <h4 className="text-xl font-bold font-mono text-red-600 mt-1">{outOfStockCount}</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
