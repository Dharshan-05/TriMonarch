import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/products.service';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteProductModal: React.FC<ConfirmDeleteProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!product) return null;

  const handleDelete = async () => {
    await onConfirm(product.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Delete Product Entry
        </span>
      }
      description={
        <span>
          Are you sure you want to delete <span className="font-semibold text-foreground">{product.name}</span> (SKU:{' '}
          <span className="font-mono text-foreground">{product.sku}</span>)?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Deleting...' : 'Delete Product'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          Deleting this product will remove its entry from master data. If this product is referenced by existing inventory records, bill of materials (BOM), or transaction orders, the request may be rejected by the backend to enforce relational integrity.
        </p>
      </div>
    </Dialog>
  );
};
