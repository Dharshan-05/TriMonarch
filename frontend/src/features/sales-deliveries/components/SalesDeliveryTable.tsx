import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesDelivery, SalesDeliveryStatus } from '@/services/salesDeliveries.service';
import { SalesDeliveryStatusBadge } from './SalesDeliveryStatusBadge';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { formatDate } from '@/lib/utils/formatters';
import { Eye, ArrowRight, XCircle, Truck, Warehouse, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SalesDeliveryTableProps {
  deliveries: SalesDelivery[];
  isLoading?: boolean;
  onView: (delivery: SalesDelivery) => void;
  onTransition: (delivery: SalesDelivery, targetStatus: SalesDeliveryStatus) => void;
  onCancel: (delivery: SalesDelivery) => void;
}

export const SalesDeliveryTable: React.FC<SalesDeliveryTableProps> = ({
  deliveries,
  isLoading = false,
  onView,
  onTransition,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('sales_order:write');

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery #</TableHead>
              <TableHead>Sales Order</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No sales deliveries found</h3>
        <p className="text-xs text-muted-foreground">
          No delivery dispatch records match your search query or status filter.
        </p>
      </div>
    );
  }

  const getNextTransition = (status: SalesDeliveryStatus): { nextStatus: SalesDeliveryStatus; label: string } | null => {
    switch (status) {
      case 'draft':
        return { nextStatus: 'confirmed', label: 'Confirm' };
      case 'confirmed':
        return { nextStatus: 'picking', label: 'Start Picking' };
      case 'picking':
        return { nextStatus: 'packed', label: 'Mark Packed' };
      case 'packed':
        return { nextStatus: 'shipped', label: 'Ship Dispatch' };
      case 'shipped':
        return { nextStatus: 'delivered', label: 'Mark Delivered' };
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Delivery Reference</TableHead>
            <TableHead>Sales Order</TableHead>
            <TableHead>Warehouse Location</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => {
            const nextStep = getNextTransition(delivery.status);
            const canBeCancelled = delivery.status !== 'cancelled' && delivery.status !== 'delivered';

            return (
              <TableRow key={delivery.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Truck className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono font-bold text-xs text-foreground">
                      {delivery.delivery_number}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/sales/orders')}
                    className="h-6 p-0 font-mono text-xs text-primary hover:underline gap-1"
                  >
                    <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                    {delivery.order_number || `SO: ${delivery.sales_order_id.substring(0, 8)}`}
                  </Button>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{delivery.warehouse_name || `Warehouse: ${delivery.warehouse_id.substring(0, 8)}`}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {formatDate(delivery.delivery_date)}
                </TableCell>

                <TableCell>
                  <SalesDeliveryStatusBadge status={delivery.status} />
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(delivery)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Delivery Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {nextStep && canWrite && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTransition(delivery, nextStep.nextStatus)}
                        className="h-7 text-[11px] gap-1 px-2 font-semibold"
                      >
                        {nextStep.label} <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}

                    {canBeCancelled && canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(delivery)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                        title="Cancel Delivery"
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
