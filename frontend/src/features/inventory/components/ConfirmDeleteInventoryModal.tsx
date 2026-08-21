import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Inventory } from '@/services/inventory.service';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteInventoryModalProps {
  item: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteInventoryModal: React.FC<ConfirmDeleteInventoryModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!item) return null;

  const handleDelete = async () => {
    await onConfirm(item.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Delete Inventory Record
        </span>
      }
      description={
        <span>
          Are you sure you want to delete the inventory record for product{' '}
          <span className="font-semibold text-foreground">{item.product_name || item.sku || item.product_id}</span>?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Deleting...' : 'Delete Record'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          Deleting this inventory record will remove stock tracking for this product at this location. Historical stock ledger movements will remain preserved for audit compliance.
        </p>
      </div>
    </Dialog>
  );
};
