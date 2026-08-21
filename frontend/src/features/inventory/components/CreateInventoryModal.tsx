import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateInventoryInput } from '@/services/inventory.service';
import { useProductsQuery } from '@/hooks/queries/use-products-query';

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('0.0000');
  const [reorderLevel, setReorderLevel] = useState('0.0000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: productsData } = useProductsQuery({ pageSize: 100 });
  const productsList = productsData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productId) {
      setErrorMsg('Product selection is required');
      return;
    }
    if (!warehouseId.trim()) {
      setErrorMsg('Warehouse ID is required');
      return;
    }

    try {
      await onSubmit({
        product_id: productId,
        warehouse_id: warehouseId.trim(),
        quantity: quantity.trim() || '0.0000',
        reorder_level: reorderLevel.trim() || '0.0000',
      });
      setProductId('');
      setWarehouseId('');
      setQuantity('0.0000');
      setReorderLevel('0.0000');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create stock entry');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Stock Record"
      description="Initialize stock tracking for a product at a specific warehouse location."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Entry'}
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

        <FormField label="Product Catalog Entry" required>
          <Select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-9 text-xs py-1"
          >
            <option value="">-- Select Product --</option>
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Warehouse UUID / ID" required>
          <Input
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            placeholder="e.g. 00000000-0000-0000-0000-000000000001"
            className="font-mono text-xs"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-muted/20">
          <FormField label="Initial Quantity">
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.0000"
              className="font-mono text-xs"
            />
          </FormField>

          <FormField label="Reorder Level">
            <Input
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              placeholder="0.0000"
              className="font-mono text-xs"
            />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
};
