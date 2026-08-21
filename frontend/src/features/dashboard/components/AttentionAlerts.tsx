import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LowStockItem } from '../types/dashboard.types';
import { Link } from 'react-router-dom';

interface AttentionAlertsProps {
  outOfStockCount: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
}

export const AttentionAlerts: React.FC<AttentionAlertsProps> = ({
  outOfStockCount,
  lowStockCount,
  lowStockItems,
}) => {
  if (outOfStockCount === 0 && lowStockCount === 0) {
    return (
      <Alert variant="default" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle className="text-xs font-semibold">Inventory Health Optimal</AlertTitle>
        <AlertDescription className="text-xs">
          All catalog products maintain stock levels above reorder thresholds. No immediate replenishment action required.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {outOfStockCount > 0 && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div>
              <AlertTitle className="text-xs font-semibold">Critical Stock Depletion</AlertTitle>
              <AlertDescription className="text-xs">
                {outOfStockCount} {outOfStockCount === 1 ? 'product is' : 'products are'} completely out of stock and cannot fulfill new sales orders.
              </AlertDescription>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold underline underline-offset-4 hover:opacity-80 flex-shrink-0"
            >
              Restock Now →
            </Link>
          </div>
        </Alert>
      )}

      {lowStockCount > 0 && (
        <Alert variant="warning" className="py-3">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div>
              <AlertTitle className="text-xs font-semibold">Reorder Threshold Reached</AlertTitle>
              <AlertDescription className="text-xs">
                {lowStockCount} {lowStockCount === 1 ? 'item is' : 'items are'} below min safety stock limits (e.g.{' '}
                {lowStockItems.slice(0, 2).map((i) => `${i.sku} (${i.quantity} left)`).join(', ')}).
              </AlertDescription>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold underline underline-offset-4 hover:opacity-80 flex-shrink-0"
            >
              View Inventory →
            </Link>
          </div>
        </Alert>
      )}
    </div>
  );
};
