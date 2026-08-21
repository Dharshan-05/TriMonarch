import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreatePurchaseOrderInput, CreatePurchaseOrderItemInput } from '@/services/purchaseOrders.service';
import { DraftPurchaseLine } from '../types/purchase-orders.types';
import { PurchaseOrderLineEditor } from './PurchaseOrderLineEditor';
import { usePartnersQuery } from '@/hooks/queries/use-partners-query';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [orderNumber, setOrderNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftPurchaseLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: partnersData } = usePartnersQuery({ pageSize: 100 });
  const suppliersList = (partnersData?.data || []).filter((p) => p.type === 'supplier');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!supplierId) {
      setErrorMsg('Supplier selection is required');
      return;
    }
    if (!orderNumber.trim()) {
      setErrorMsg('Order Number is required');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('Purchase order must contain at least one product line item');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!line.product_id) {
        setErrorMsg(`Line #${i + 1}: Product selection is required`);
        return;
      }
      if (parseFloat(line.quantity || '0') <= 0) {
        setErrorMsg(`Line #${i + 1}: Quantity must be greater than zero`);
        return;
      }
    }

    const itemsPayload: CreatePurchaseOrderItemInput[] = lines.map((l) => ({
      product_id: l.product_id,
      quantity: l.quantity,
      unit_cost: l.unit_cost,
      tax_rate: l.tax_rate,
      discount_amount: l.discount_amount || '0.0000',
    }));

    try {
      await onSubmit({
        supplier_id: supplierId,
        order_number: orderNumber.trim(),
        currency,
        notes: notes.trim() || undefined,
        items: itemsPayload,
      });

      setSupplierId('');
      setOrderNumber(`PO-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setLines([]);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create purchase order');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Purchase Order"
      description="Issue a new procurement purchase order to a business supplier with line items."
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {errorMsg && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Supplier Partner" required>
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 text-xs py-1"
            >
              <option value="">-- Select Supplier --</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.email ? `(${s.email})` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Purchase Order Number" required>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. PO-2026-0001"
              className="font-mono text-xs"
              required
            />
          </FormField>
        </div>

        <div className="w-32">
          <FormField label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9 text-xs py-1 font-mono">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </Select>
          </FormField>
        </div>

        {/* Purchase Order Line Editor */}
        <PurchaseOrderLineEditor lines={lines} onLinesChange={setLines} currency={currency} />

        <FormField label="Procurement Notes & Vendor Terms">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special delivery instructions or vendor payment terms..."
            rows={2}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
