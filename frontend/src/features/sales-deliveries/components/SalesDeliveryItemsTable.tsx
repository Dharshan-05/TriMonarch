import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { SalesDeliveryItem } from '@/services/salesDeliveries.service';
import { formatNumber } from '@/lib/utils/formatters';
import { Package } from 'lucide-react';

interface SalesDeliveryItemsTableProps {
  items: SalesDeliveryItem[];
}

export const SalesDeliveryItemsTable: React.FC<SalesDeliveryItemsTableProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-center border rounded text-xs text-muted-foreground">
        No delivery line items recorded.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Product / SKU</TableHead>
            <TableHead align="right">Delivered Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => {
            const qtyNum = parseFloat(item.quantity || '0');

            return (
              <TableRow key={item.id || idx} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">
                        {item.product_name || `Product: ${item.product_id.substring(0, 8)}`}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.sku || item.product_id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {formatNumber(qtyNum)} {item.unit || ''}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
