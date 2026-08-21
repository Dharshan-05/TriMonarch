import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateSalesOrderInput, CreateSalesOrderItemInput } from '@/services/salesOrders.service';
import { DraftOrderLine } from '../types/sales-orders.types';
import { SalesOrderLineEditor } from './SalesOrderLineEditor';
import { usePartnersQuery } from '@/hooks/queries/use-partners-query';

interface CreateSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSalesOrderInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateSalesOrderModal: React.FC<CreateSalesOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [orderNumber, setOrderNumber] = useState(`SO-${Date.now().toString().slice(-6)}`);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftOrderLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: partnersData } = usePartnersQuery({ pageSize: 100 });
  const customersList = (partnersData?.data || []).filter((p) => p.type === 'customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Customer selection is required');
      return;
    }
    if (!orderNumber.trim()) {
      setErrorMsg('Order Number is required');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('Sales order must contain at least one product line');
      return;
    }

    // Verify all lines have product selected and valid quantities
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

    let subtotalVal = 0;
    let taxVal = 0;
    let totalVal = 0;

    const itemsPayload: CreateSalesOrderItemInput[] = lines.map((l, idx) => {
      const q = parseFloat(l.quantity || '0');
      const p = parseFloat(l.unit_price || '0');
      const d = parseFloat(l.discount_amount || '0');
      const tr = parseFloat(l.tax_rate || '0');

      const sub = Math.max(0, q * p - d);
      const tax = sub * (tr / 100);
      const tot = sub + tax;

      subtotalVal += sub;
      taxVal += tax;
      totalVal += tot;

      return {
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        tax_rate: l.tax_rate,
        discount_amount: l.discount_amount || '0.0000',
        tax_amount: tax.toFixed(4),
        line_total: tot.toFixed(4),
        sequence: idx + 1,
      };
    });

    try {
      await onSubmit({
        customer_id: customerId,
        order_number: orderNumber.trim(),
        currency,
        subtotal: subtotalVal.toFixed(4),
        tax_amount: taxVal.toFixed(4),
        total_amount: totalVal.toFixed(4),
        notes: notes.trim() || undefined,
        items: itemsPayload,
      });

      setCustomerId('');
      setOrderNumber(`SO-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setLines([]);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create sales order');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Sales Order"
      description="Issue a new sales order with customer assignment and line items."
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Sales Order'}
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
          <FormField label="Customer" required>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 text-xs py-1"
            >
              <option value="">-- Select Customer --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Order Number" required>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. SO-2026-0001"
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

        {/* Order Line Item Editor */}
        <SalesOrderLineEditor lines={lines} onLinesChange={setLines} currency={currency} />

        <FormField label="Order Notes & Special Instructions">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special delivery instructions or customer PO references..."
            rows={2}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
