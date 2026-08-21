import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { PurchaseReceiptItem } from '@/services/purchaseReceipts.service';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';

interface PurchaseReceiptItemsTableProps {
  items: PurchaseReceiptItem[];
  currency?: string;
}

export const PurchaseReceiptItemsTable: React.FC<PurchaseReceiptItemsTableProps> = ({
  items,
  currency = 'USD',
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-center border rounded text-muted-foreground text-xs">
        No receipt line items recorded.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Product / SKU</TableHead>
            <TableHead align="right">Received Qty</TableHead>
            <TableHead align="right">Unit Cost</TableHead>
            <TableHead align="right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => {
            const qtyNum = parseFloat(item.quantity || '0');
            const costNum = parseFloat(item.unit_cost || '0');
            const subtotal = qtyNum * costNum;

            return (
              <TableRow key={item.id || idx}>
                <TableCell className="font-mono text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">
                      {item.product_name || `Product: ${item.product_id.substring(0, 8)}`}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{item.sku || item.product_id}</span>
                  </div>
                </TableCell>
                <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {formatNumber(qtyNum)}
                </TableCell>
                <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(costNum, currency)}
                </TableCell>
                <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {formatCurrency(subtotal, currency)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
