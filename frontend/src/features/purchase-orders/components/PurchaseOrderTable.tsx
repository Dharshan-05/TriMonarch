import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseOrder } from '@/services/purchaseOrders.service';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { Eye, Edit3, Send, CheckCircle2, XCircle, Trash2, ShoppingBag, Building2 } from 'lucide-react';

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  isLoading?: boolean;
  onView: (order: PurchaseOrder) => void;
  onSubmitOrder: (order: PurchaseOrder) => void;
  onApproveOrder: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onCancel: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  orders,
  isLoading = false,
  onView,
  onSubmitOrder,
  onApproveOrder,
  onEdit,
  onCancel,
  onDelete,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('purchase_order:write');
  const canApprove = hasPermission('purchase_order:approve') || canWrite;
  const canDelete = hasPermission('purchase_order:delete');

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Reference</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead align="right">Subtotal</TableHead>
              <TableHead align="right">Tax</TableHead>
              <TableHead align="right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell align="right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No purchase orders found</h3>
        <p className="text-xs text-muted-foreground">
          No procurement orders match your current search terms or status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Reference</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead align="right">Subtotal</TableHead>
            <TableHead align="right">Tax</TableHead>
            <TableHead align="right">Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const subtotalNum = parseFloat(order.subtotal || '0');
            const taxNum = parseFloat(order.tax_amount || '0');
            const totalNum = parseFloat(order.total_amount || '0');

            const isDraft = order.status === 'draft';
            const isSubmitted = order.status === 'submitted';
            const canBeCancelled = order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'received';

            return (
              <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {order.order_number}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{order.supplier_name || `Supplier: ${order.supplier_id.substring(0, 8)}`}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {formatDate(order.order_date)}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(subtotalNum, order.currency || 'USD')}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(taxNum, order.currency || 'USD')}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {formatCurrency(totalNum, order.currency || 'USD')}
                </TableCell>

                <TableCell>
                  <PurchaseOrderStatusBadge status={order.status} />
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(order)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Order Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {isDraft && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSubmitOrder(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-sky-600"
                        title="Submit Order for Approval"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}

                    {(isDraft || isSubmitted) && canApprove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApproveOrder(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                        title="Approve Purchase Order"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}

                    {isDraft && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Edit Order"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}

                    {canBeCancelled && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                        title="Cancel Order"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}

                    {isDraft && canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
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
