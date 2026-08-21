import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SalesDelivery } from '@/services/salesDeliveries.service';
import { SalesDeliveryStatusBadge } from './SalesDeliveryStatusBadge';
import { SalesDeliveryItemsTable } from './SalesDeliveryItemsTable';
import { formatDate } from '@/lib/utils/formatters';
import { ShoppingCart, History, Truck, Warehouse, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SalesDeliveryDetailModalProps {
  delivery: SalesDelivery | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalesDeliveryDetailModal: React.FC<SalesDeliveryDetailModalProps> = ({
  delivery,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!delivery) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Sales Delivery Profile Inspector"
      description="Detailed operational fulfillment tracking, warehouse assignment, and line items."
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/sales/orders');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> View Sales Order
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/stock-ledger');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <History className="h-3.5 w-3.5" /> View Stock Ledger
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Delivery Header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border">
          <div>
            <span className="text-[11px] text-muted-foreground block">Delivery Number</span>
            <span className="font-mono font-bold text-base text-foreground">{delivery.delivery_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
            <SalesDeliveryStatusBadge status={delivery.status} />
          </div>
        </div>

        {/* Order & Warehouse Meta */}
        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Target Sales Order
            </span>
            <span className="font-mono font-semibold text-foreground text-xs block">
              {delivery.order_number || delivery.sales_order_id}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Warehouse className="h-3 w-3" /> Warehouse Location
            </span>
            <span className="font-semibold text-foreground text-xs block">
              {delivery.warehouse_name || delivery.warehouse_id}
            </span>
          </div>
        </div>

        {/* Dispatch Timeline */}
        <div className="p-3 border rounded-lg bg-muted/20 space-y-2">
          <span className="font-semibold text-muted-foreground block flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Fulfillment Timeline
          </span>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-muted-foreground block">Dispatch Date:</span>
              <span className="text-foreground font-semibold">{formatDate(delivery.delivery_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Shipped At:</span>
              <span className="text-foreground font-semibold">{delivery.shipped_at ? formatDate(delivery.shipped_at) : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Delivered At:</span>
              <span className="text-foreground font-semibold">{delivery.delivered_at ? formatDate(delivery.delivered_at) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" /> Delivered Products ({delivery.items?.length || 0})
          </h4>
          <SalesDeliveryItemsTable items={delivery.items || []} />
        </div>

        {/* Notes */}
        {delivery.notes && (
          <div className="p-3 border rounded-lg bg-card space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground block flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Dispatch Notes:
            </span>
            <p className="text-foreground">{delivery.notes}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
