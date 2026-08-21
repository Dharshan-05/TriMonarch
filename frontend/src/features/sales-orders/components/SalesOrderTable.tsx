import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesOrder } from '@/services/salesOrders.service';
import { SalesOrderStatusBadge } from './SalesOrderStatusBadge';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { Eye, Edit3, CheckCircle2, XCircle, Trash2, ShoppingCart, User } from 'lucide-react';

interface SalesOrderTableProps {
  orders: SalesOrder[];
  isLoading?: boolean;
  onView: (order: SalesOrder) => void;
  onConfirm: (order: SalesOrder) => void;
  onEdit: (order: SalesOrder) => void;
  onCancel: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
}

export const SalesOrderTable: React.FC<SalesOrderTableProps> = ({
  orders,
  isLoading = false,
  onView,
  onConfirm,
  onEdit,
  onCancel,
  onDelete,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('sales_order:write');
  const canDelete = hasPermission('sales_order:delete');

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
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
        <h3 className="text-sm font-semibold text-foreground">No sales orders found</h3>
        <p className="text-xs text-muted-foreground">
          No sales orders match your active search terms or status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Reference</TableHead>
            <TableHead>Customer</TableHead>
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
            const canBeCancelled = order.status !== 'cancelled' && order.status !== 'completed';

            return (
              <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {order.order_number}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{order.customer_name || `Customer: ${order.customer_id.substring(0, 8)}`}</span>
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
                  <SalesOrderStatusBadge status={order.status} />
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(order)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {isDraft && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfirm(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                        title="Confirm Sales Order"
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
