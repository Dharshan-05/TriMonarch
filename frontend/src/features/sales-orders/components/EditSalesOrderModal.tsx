import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SalesOrder, UpdateSalesOrderInput } from '@/services/salesOrders.service';

interface EditSalesOrderModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateSalesOrderInput) => Promise<void>;
  isLoading?: boolean;
}

export const EditSalesOrderModal: React.FC<EditSalesOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setOrderNumber(order.order_number || '');
      setNotes(order.notes || '');
      setErrorMsg(null);
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await onSubmit(order.id, {
        order_number: orderNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to update sales order');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Draft Sales Order"
      description="Update draft order parameters before confirmation."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Saving...' : 'Save Order'}
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
            <span>Customer Reference:</span>
            <span className="font-semibold text-foreground">{order.customer_name || order.customer_id}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Current Status:</span>
            <span className="font-mono text-foreground font-semibold uppercase">{order.status}</span>
          </div>
        </div>

        <FormField label="Order Number" required>
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. SO-2026-0001"
            className="font-mono text-xs"
            required
          />
        </FormField>

        <FormField label="Notes & Special Instructions">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Order notes..."
            rows={3}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
