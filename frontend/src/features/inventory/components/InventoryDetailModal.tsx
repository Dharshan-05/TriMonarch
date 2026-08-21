import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inventory } from '@/services/inventory.service';
import { formatNumber, formatDate } from '@/lib/utils/formatters';
import { History, PackageCheck, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InventoryDetailModalProps {
  item: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ item, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!item) return null;

  const qtyNum = parseFloat(item.quantity || '0');
  const reorderNum = parseFloat(item.reorder_level || '0');

  const getStatusBadge = () => {
    if (qtyNum <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (reorderNum > 0 && qtyNum <= reorderNum) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="active">In Stock</Badge>;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Inventory Record Profile"
      description="Operational stock levels, threshold parameters, and location references."
      className="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/stock-ledger');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <History className="h-3.5 w-3.5" /> Stock Ledger
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/purchasing/receipts');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <PackageCheck className="h-3.5 w-3.5" /> Goods Receipts
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/sales/deliveries');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Truck className="h-3.5 w-3.5" /> Sales Deliveries
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
          <div className="h-10 w-10 rounded bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
            {item.sku ? item.sku.substring(0, 4) : 'STK'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground truncate">
              {item.product_name || `Product ID: ${item.product_id}`}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {item.sku || `SKU: ${item.product_id}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Stock Status</span>
            {getStatusBadge()}
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Warehouse Reference</span>
            <span className="font-mono text-foreground font-semibold block truncate">
              {item.warehouse_name || item.warehouse_id}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">On-Hand Quantity</span>
            <span className="font-mono font-bold text-foreground text-sm">{formatNumber(qtyNum)}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              (Raw String: {item.quantity || '0.0000'})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Reorder Threshold</span>
            <span className="font-mono font-bold text-foreground text-sm">{formatNumber(reorderNum)}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              (Raw String: {item.reorder_level || '0.0000'})
            </span>
          </div>

          <div className="col-span-2 border-t pt-2">
            <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
            <span className="font-mono text-[10px] text-foreground block truncate">
              {item.organization_id || 'System Default'}
            </span>
          </div>

          <div className="col-span-2 pt-1 border-t flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>Created: {item.created_at ? formatDate(item.created_at) : 'N/A'}</span>
            <span>Updated: {item.updated_at ? formatDate(item.updated_at) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
