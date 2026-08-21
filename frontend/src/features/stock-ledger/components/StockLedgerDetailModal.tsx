import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StockLedgerEntry } from '@/services/stockLedger.service';
import { StockLedgerMovementBadge } from './StockLedgerMovementBadge';
import { formatDate, formatNumber } from '@/lib/utils/formatters';
import { Boxes, PackageCheck, Truck, ShoppingBag, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StockLedgerDetailModalProps {
  entry: StockLedgerEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockLedgerDetailModal: React.FC<StockLedgerDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!entry) return null;

  const qtyNum = parseFloat(entry.quantity || '0');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Stock Ledger Audit Detail"
      description="Immutable transaction record for stock movement and audit trace."
      className="max-w-lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/inventory');
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <Boxes className="h-3 w-3" /> Inventory
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/purchasing/receipts');
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <PackageCheck className="h-3 w-3" /> Receipts
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/sales/deliveries');
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <Truck className="h-3 w-3" /> Deliveries
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/purchasing/orders');
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <ShoppingBag className="h-3 w-3" /> POs
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/sales/orders');
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <FileText className="h-3 w-3" /> SOs
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Transaction Header */}
        <div className="p-3 border rounded-lg bg-surface flex justify-between items-center">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Movement Classification</span>
            <StockLedgerMovementBadge type={entry.movement_type} />
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block mb-0.5">Audit Record ID</span>
            <span className="font-mono text-xs font-bold text-foreground">{entry.id}</span>
          </div>
        </div>

        {/* Product & Warehouse Section */}
        <div className="border p-3 rounded-lg bg-card space-y-2">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Catalog & Location Context
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Product Identity</span>
              <span className="font-semibold text-foreground truncate block">
                {entry.product_name || entry.product_id}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground block">
                {entry.sku || `Product ID: ${entry.product_id}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Warehouse Location</span>
              <span className="font-mono text-foreground font-semibold block truncate">
                {entry.warehouse_name || entry.warehouse_id}
              </span>
            </div>
          </div>
        </div>

        {/* Movement Quantities */}
        <div className="border p-3 rounded-lg bg-card space-y-2">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Quantity Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              <span className="text-[11px] text-muted-foreground block font-sans">Movement Delta</span>
              <span
                className={`text-sm font-bold ${
                  qtyNum < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {formatNumber(qtyNum)} {entry.unit || 'pcs'}
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                (Raw String: {entry.quantity})
              </span>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block font-sans">Post-Transaction Balance</span>
              <span className="text-sm font-bold text-foreground">
                {entry.balance_after ? `${formatNumber(parseFloat(entry.balance_after))} ${entry.unit || 'pcs'}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit & Reference Context */}
        <div className="border p-3 rounded-lg bg-card space-y-2">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trace & Reference
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference Type:</span>
              <span className="font-mono font-semibold text-foreground">{entry.reference_type || 'Manual'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference Document ID:</span>
              <span className="font-mono text-foreground truncate max-w-[200px]">{entry.reference_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audit Reason:</span>
              <span className="text-foreground">{entry.reason || 'Standard Transaction'}</span>
            </div>
            {entry.notes && (
              <div className="pt-1 border-t">
                <span className="text-muted-foreground block mb-0.5">Notes:</span>
                <p className="text-[11px] text-foreground bg-muted/20 p-1.5 rounded">{entry.notes}</p>
              </div>
            )}
            <div className="pt-1.5 border-t flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>Timestamp: {formatDate(entry.created_at)}</span>
              <span>Operator: {entry.user_name || entry.created_by || 'System'}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
