import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Warehouse } from '@/services/warehouses.service';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { formatDate } from '@/lib/utils/formatters';
import { Boxes, History, PackageCheck, Truck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WarehouseDetailModalProps {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WarehouseDetailModal: React.FC<WarehouseDetailModalProps> = ({
  warehouse,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!warehouse) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Warehouse Facility Profile"
      description="Facility identity, physical location details, and operational cross-module context."
      className="max-w-lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/inventory?warehouseId=${warehouse.id}`);
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
                navigate(`/stock-ledger?warehouseId=${warehouse.id}`);
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <History className="h-3 w-3" /> Stock Ledger
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/purchasing/receipts?warehouseId=${warehouse.id}`);
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
                navigate(`/sales/deliveries?warehouseId=${warehouse.id}`);
              }}
              className="gap-1 text-[11px] font-semibold h-7"
            >
              <Truck className="h-3 w-3" /> Deliveries
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Header Summary */}
        <div className="p-3 border rounded-lg bg-surface flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="font-bold text-sm text-foreground block">{warehouse.name}</span>
            <span className="font-mono text-xs text-primary font-semibold block">Code: {warehouse.code}</span>
          </div>
          <WarehouseStatusBadge status={warehouse.status} />
        </div>

        {/* Location & Metadata */}
        <div className="border p-3 rounded-lg bg-card space-y-3">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Location & Physical Address
          </h4>
          <div className="flex items-start gap-2 text-xs text-foreground">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="font-medium">{warehouse.location || 'No physical location specified'}</span>
          </div>
        </div>

        <div className="border p-3 rounded-lg bg-card space-y-2">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            System Identity & Timestamps
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse ID:</span>
              <span className="text-foreground">{warehouse.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization ID:</span>
              <span className="text-foreground">{warehouse.organization_id}</span>
            </div>
            <div className="pt-1.5 border-t flex justify-between text-[11px] text-muted-foreground">
              <span>Created: {formatDate(warehouse.created_at)}</span>
              <span>Updated: {formatDate(warehouse.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
