import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateSalesDeliveryInput } from '@/services/salesDeliveries.service';
import { useSalesOrdersListQuery } from '@/features/sales-orders/hooks/useSalesOrders';

interface CreateSalesDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSalesDeliveryInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateSalesDeliveryModal: React.FC<CreateSalesDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [salesOrderId, setSalesOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('00000000-0000-0000-0000-000000000001'); // Default warehouse UUID
  const [deliveryNumber, setDeliveryNumber] = useState(`DEL-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: salesOrdersData } = useSalesOrdersListQuery({ pageSize: 100 });
  const confirmedOrders = (salesOrdersData?.data || []).filter(
    (o) => o.status === 'confirmed' || o.status === 'processing' || o.status === 'draft',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!salesOrderId) {
      setErrorMsg('Confirmed Sales Order selection is required');
      return;
    }
    if (!warehouseId.trim()) {
      setErrorMsg('Warehouse ID is required');
      return;
    }

    try {
      await onSubmit({
        sales_order_id: salesOrderId,
        warehouse_id: warehouseId.trim(),
        delivery_number: deliveryNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSalesOrderId('');
      setDeliveryNumber(`DEL-${Date.now().toString().slice(-6)}`);
      setNotes('');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create sales delivery');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Initiate Sales Delivery Dispatch"
      description="Create a delivery dispatch order against a confirmed customer sales order."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Initiating...' : 'Create Delivery'}
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

        <FormField label="Target Sales Order" required>
          <Select
            value={salesOrderId}
            onChange={(e) => setSalesOrderId(e.target.value)}
            className="h-9 text-xs py-1"
          >
            <option value="">-- Select Sales Order --</option>
            {confirmedOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} — {o.customer_name || `Cust: ${o.customer_id.substring(0, 8)}`} (${o.total_amount})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Delivery Reference Number" required>
          <Input
            value={deliveryNumber}
            onChange={(e) => setDeliveryNumber(e.target.value)}
            placeholder="e.g. DEL-2026-0001"
            className="font-mono text-xs"
            required
          />
        </FormField>

        <FormField label="Warehouse Identifier" required>
          <Input
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            placeholder="Warehouse UUID"
            className="font-mono text-xs"
            required
          />
        </FormField>

        <FormField label="Dispatch Notes & Shipping Instructions">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Carrier information, tracking numbers, or warehouse instructions..."
            rows={3}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
