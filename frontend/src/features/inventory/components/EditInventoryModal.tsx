import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Inventory, UpdateInventoryInput } from '@/services/inventory.service';

interface EditInventoryModalProps {
  item: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateInventoryInput) => Promise<void>;
  isLoading?: boolean;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [reorderLevel, setReorderLevel] = useState('0.0000');
  const [quantity, setQuantity] = useState('0.0000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setReorderLevel(item.reorder_level || '0.0000');
      setQuantity(item.quantity || '0.0000');
      setErrorMsg(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await onSubmit(item.id, {
        reorder_level: reorderLevel.trim() || '0.0000',
        quantity: quantity.trim() || '0.0000',
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to update record');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Inventory Parameters"
      description="Update reorder levels or base parameters for this stock entry."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Saving...' : 'Save Parameters'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="p-3 border rounded-lg bg-surface space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Product ID / SKU:</span>
            <span className="font-mono text-foreground font-semibold">{item.sku || item.product_id}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Warehouse ID:</span>
            <span className="font-mono text-foreground">{item.warehouse_id}</span>
          </div>
        </div>

        <FormField label="Reorder Threshold Level">
          <Input
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            placeholder="0.0000"
            className="font-mono text-xs"
          />
        </FormField>

        <FormField label="Base Stock Quantity">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.0000"
            className="font-mono text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
