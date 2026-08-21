import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { CreatePurchaseReceiptInput, CreatePurchaseReceiptItemInput } from '@/services/purchaseReceipts.service';
import { DraftReceiptLine } from '../types/purchase-receipts.types';
import { usePurchaseOrdersListQuery, usePurchaseOrderDetailQuery } from '@/features/purchase-orders/hooks/usePurchaseOrders';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiPaginatedResponse } from '@/types/api';
import { formatNumber } from '@/lib/utils/formatters';

interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
}

interface CreatePurchaseReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseReceiptInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreatePurchaseReceiptModal: React.FC<CreatePurchaseReceiptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftReceiptLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch approved/processing POs
  const { data: poResponse } = usePurchaseOrdersListQuery({ pageSize: 100 });
  const receivableOrders = (poResponse?.data || []).filter(
    (po) => po.status === 'approved' || po.status === 'processing' || po.status === 'partially_received',
  );

  // Fetch selected PO detail
  const { data: selectedPoDetail } = usePurchaseOrderDetailQuery(purchaseOrderId);

  // Fetch warehouses
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses', 'list'],
    queryFn: () => apiClient.get<ApiPaginatedResponse<WarehouseOption>>('/warehouses'),
  });
  const warehousesList = warehousesResponse?.data || [];

  // When PO changes, update warehouse and lines
  useEffect(() => {
    if (selectedPoDetail) {
      if (selectedPoDetail.warehouse_id) {
        setWarehouseId(selectedPoDetail.warehouse_id);
      }
      const poItems = selectedPoDetail.items || [];
      const newLines: DraftReceiptLine[] = poItems.map((item) => ({
        id: `line-${item.id}`,
        purchase_order_item_id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity || '1.0000',
        unit_cost: item.unit_cost || '0.0000',
        ordered_quantity: item.quantity,
      }));
      setLines(newLines);
    }
  }, [selectedPoDetail]);

  const handleUpdateLineQty = (index: number, qtyStr: string) => {
    const updated = [...lines];
    if (updated[index]) {
      updated[index] = { ...updated[index]!, quantity: qtyStr };
      setLines(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!purchaseOrderId) {
      setErrorMsg('Purchase Order selection is required');
      return;
    }
    if (!warehouseId) {
      setErrorMsg('Warehouse Location is required');
      return;
    }
    if (lines.length === 0) {
      setErrorMsg('Purchase receipt must contain at least one item');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (parseFloat(line.quantity || '0') <= 0) {
        setErrorMsg(`Line #${i + 1}: Received quantity must be greater than zero`);
        return;
      }
    }

    const itemsPayload: CreatePurchaseReceiptItemInput[] = lines.map((l) => ({
      purchase_order_item_id: l.purchase_order_item_id,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_cost: l.unit_cost,
    }));

    try {
      await onSubmit({
        purchase_order_id: purchaseOrderId,
        warehouse_id: warehouseId,
        receipt_number: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: itemsPayload,
      });

      setPurchaseOrderId('');
      setWarehouseId('');
      setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setLines([]);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create purchase receipt');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Purchase Goods Receipt"
      description="Initiate a new warehouse receiving record against an approved purchase order."
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Goods Receipt'}
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
          <FormField label="Target Purchase Order" required>
            <Select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className="h-9 text-xs py-1"
            >
              <option value="">-- Select Approved PO --</option>
              {receivableOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.order_number} ({po.supplier_name || 'Supplier'})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Receiving Warehouse Location" required>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="h-9 text-xs py-1"
            >
              <option value="">-- Select Warehouse --</option>
              {warehousesList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="w-48">
          <FormField label="Receipt Number">
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="REC-10001"
              className="font-mono text-xs"
            />
          </FormField>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2 border p-3 rounded-lg bg-card">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Receiving Line Items ({lines.length})
          </h4>

          {lines.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded text-xs text-muted-foreground">
              Select an approved Purchase Order to load receiving line items.
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product / SKU</TableHead>
                    <TableHead align="right">PO Ordered Qty</TableHead>
                    <TableHead align="right">Current Receipt Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">
                            {line.product_name || `Product: ${line.product_id.substring(0, 8)}`}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{line.sku || line.product_id}</span>
                        </div>
                      </TableCell>
                      <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatNumber(parseFloat(line.ordered_quantity || '0'))}
                      </TableCell>
                      <TableCell align="right">
                        <Input
                          value={line.quantity}
                          onChange={(e) => handleUpdateLineQty(idx, e.target.value)}
                          placeholder="1.0000"
                          className="h-7 w-28 font-mono text-xs text-right ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <FormField label="Receipt Dispatch Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Receiving dock inspection notes, bill of lading #..."
            rows={2}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
