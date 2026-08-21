import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateProductInput, ProductStatus } from '@/services/products.service';
import {
  PRODUCT_STATUS_OPTIONS,
  COMMON_PRODUCT_CATEGORIES,
  COMMON_UNITS_OF_MEASURE,
} from '../types/products.types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState('0.0000');
  const [cost, setCost] = useState('0.0000');
  const [taxRate, setTaxRate] = useState('0.000000');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sku.trim()) {
      setErrorMsg('Product SKU is required');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Product Name is required');
      return;
    }

    try {
      await onSubmit({
        sku: sku.trim(),
        name: name.trim(),
        category: category.trim() || null,
        unit: unit.trim() || 'pcs',
        price: price.trim() || '0.0000',
        cost: cost.trim() || '0.0000',
        tax_rate: taxRate.trim() || '0.000000',
        description: description.trim() || null,
        status,
      });
      setSku('');
      setName('');
      setCategory('');
      setUnit('pcs');
      setPrice('0.0000');
      setCost('0.0000');
      setTaxRate('0.000000');
      setDescription('');
      setStatus('active');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create product');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create ERP Product"
      description="Add a new stockable, sellable, or component product to your master inventory directory."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="SKU Code" required>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PRD-1001"
              className="font-mono text-xs"
              required
            />
          </FormField>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 text-xs py-1">
              <option value="">Select Category</option>
              {COMMON_PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <FormField label="Product Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Industrial Steel Housing Plate"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Unit of Measure (UOM)</Label>
            <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-9 text-xs py-1">
              {COMMON_UNITS_OF_MEASURE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Product Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className="h-9 text-xs py-1">
              {PRODUCT_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-muted/20">
          <FormField label="Selling Price ($)">
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0000"
              className="font-mono text-xs"
            />
          </FormField>

          <FormField label="Cost Price ($)">
            <Input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.0000"
              className="font-mono text-xs"
            />
          </FormField>
        </div>

        <FormField label="Description / Specification">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical details or specifications..."
            rows={2}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
