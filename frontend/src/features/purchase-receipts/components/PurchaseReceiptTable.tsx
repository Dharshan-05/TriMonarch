import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseReceipt } from '@/services/purchaseReceipts.service';
import { PurchaseReceiptStatusBadge } from './PurchaseReceiptStatusBadge';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { formatDate } from '@/lib/utils/formatters';
import { Eye, PackageCheck, CheckCheck, XCircle, ShoppingBag, Warehouse } from 'lucide-react';

interface PurchaseReceiptTableProps {
  receipts: PurchaseReceipt[];
  isLoading?: boolean;
  onView: (receipt: PurchaseReceipt) => void;
  onPostReceipt: (receipt: PurchaseReceipt) => void;
  onCompleteReceipt: (receipt: PurchaseReceipt) => void;
  onCancelReceipt: (receipt: PurchaseReceipt) => void;
}

export const PurchaseReceiptTable: React.FC<PurchaseReceiptTableProps> = ({
  receipts,
  isLoading = false,
  onView,
  onPostReceipt,
  onCompleteReceipt,
  onCancelReceipt,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('purchase_order:write');

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead>Warehouse Location</TableHead>
              <TableHead>Receipt Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No purchase goods receipts found</h3>
        <p className="text-xs text-muted-foreground">
          No warehouse receipt dispatches match your search or filter parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt #</TableHead>
            <TableHead>Purchase Order</TableHead>
            <TableHead>Warehouse Location</TableHead>
            <TableHead>Receipt Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => {
            const isDraft = receipt.status === 'draft';
            const isPosted = receipt.status === 'posted';
            const canCancel = receipt.status === 'draft';

            return (
              <TableRow key={receipt.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <PackageCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {receipt.receipt_number}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{receipt.order_number || `PO: ${receipt.purchase_order_id.substring(0, 8)}`}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Warehouse className="h-3.5 w-3.5" />
                    <span>{receipt.warehouse_name || `Location: ${receipt.warehouse_id.substring(0, 8)}`}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {formatDate(receipt.receipt_date)}
                </TableCell>

                <TableCell>
                  <PurchaseReceiptStatusBadge status={receipt.status} />
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(receipt)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Receipt Inspector"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {isDraft && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPostReceipt(receipt)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                        title="Post Receipt (Deduct PO & Add Inventory Stock)"
                      >
                        <PackageCheck className="h-4 w-4" />
                      </Button>
                    )}

                    {isPosted && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompleteReceipt(receipt)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
                        title="Mark Completed"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}

                    {canCancel && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancelReceipt(receipt)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                        title="Cancel Receipt"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
