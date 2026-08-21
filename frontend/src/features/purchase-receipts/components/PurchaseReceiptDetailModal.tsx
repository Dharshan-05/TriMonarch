import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseReceipt } from '@/services/purchaseReceipts.service';
import { PurchaseReceiptStatusBadge } from './PurchaseReceiptStatusBadge';
import { PurchaseReceiptItemsTable } from './PurchaseReceiptItemsTable';
import { formatDate } from '@/lib/utils/formatters';
import { ShoppingBag, Boxes, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseReceiptDetailModalProps {
  receipt: PurchaseReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseReceiptDetailModal: React.FC<PurchaseReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!receipt) return null;

  const items = receipt.items || [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Goods Receipt Summary Profile"
      description="Detailed breakdown of received warehouse items, stock movements, and purchase order fulfillment."
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/purchasing/orders');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> View Purchase Orders
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/inventory');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Boxes className="h-3.5 w-3.5" /> View Inventory
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
        {/* Receipt Header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border">
          <div>
            <span className="text-[11px] text-muted-foreground block">Receipt Dispatch Number</span>
            <span className="font-mono font-bold text-base text-foreground">{receipt.receipt_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
            <PurchaseReceiptStatusBadge status={receipt.status} />
          </div>
        </div>

        {/* PO & Warehouse Context */}
        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block">Purchase Order Reference</span>
            <span className="font-mono font-semibold text-foreground text-xs block">
              {receipt.order_number || `PO ID: ${receipt.purchase_order_id}`}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Receiving Warehouse</span>
            <span className="font-semibold text-foreground text-xs block">
              {receipt.warehouse_name || `Warehouse ID: ${receipt.warehouse_id}`}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Receipt Date</span>
            <span className="font-mono text-foreground block">
              {formatDate(receipt.receipt_date)}
            </span>
          </div>
          {receipt.received_at && (
            <div>
              <span className="text-[11px] text-muted-foreground block">Posted Stock Date</span>
              <span className="font-mono text-foreground block">
                {formatDate(receipt.received_at)}
              </span>
            </div>
          )}
        </div>

        {/* Received Items */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Received Goods Line Breakdown ({items.length})
          </h4>
          <PurchaseReceiptItemsTable items={items} />
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="p-3 border rounded-lg bg-muted/20 space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground block">Receipt Dispatch Notes:</span>
            <p className="text-foreground">{receipt.notes}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
