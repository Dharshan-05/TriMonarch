import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Inventory, AdjustInventoryInput } from '@/services/inventory.service';
import { AdjustmentMode } from '../types/inventory.types';

interface AdjustStockModalProps {
  item: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: AdjustInventoryInput) => Promise<void>;
  isLoading?: boolean;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<AdjustmentMode>('delta');
  const [adjustmentValue, setAdjustmentValue] = useState('0.0000');
  const [reason, setReason] = useState('Physical Audit Count');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setMode('delta');
      setAdjustmentValue('0.0000');
      setReason('Physical Audit Count');
      setNotes('');
      setErrorMsg(null);
    }
  }, [item]);

  if (!item) return null;

  const currentQtyNum = parseFloat(item.quantity || '0');
  const adjValueNum = parseFloat(adjustmentValue || '0');

  const projectedQty =
    mode === 'target' ? adjValueNum : currentQtyNum + adjValueNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (projectedQty < 0) {
      setErrorMsg('Resulting inventory quantity cannot be negative');
      return;
    }

    try {
      const payload: AdjustInventoryInput = {
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (mode === 'target') {
        payload.target_quantity = adjustmentValue.trim();
      } else {
        payload.delta_quantity = adjustmentValue.trim();
      }

      await onSubmit(item.id, payload);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to adjust stock');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Stock Adjustment Transaction"
      description="Perform an auditable stock movement or physical inventory count adjustment."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Processing...' : 'Confirm Adjustment'}
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
            <span>Product:</span>
            <span className="font-semibold text-foreground">{item.product_name || item.product_id}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Current On-Hand Quantity:</span>
            <span className="font-mono font-bold text-foreground">{item.quantity}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Adjustment Mode</Label>
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as AdjustmentMode)}
              className="h-9 text-xs py-1"
            >
              <option value="delta">Relative Delta (+ / -)</option>
              <option value="target">Set Total Target</option>
            </Select>
          </div>

          <FormField label={mode === 'delta' ? 'Delta Qty (+ / -)' : 'New Target Qty'}>
            <Input
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="0.0000"
              className="font-mono text-xs"
            />
          </FormField>
        </div>

        <div className="p-3 border rounded-lg bg-muted/20 flex justify-between items-center text-xs font-mono">
          <span className="text-muted-foreground">Projected Balance:</span>
          <span className={`font-bold ${projectedQty < 0 ? 'text-red-600' : 'text-foreground'}`}>
            {projectedQty.toFixed(4)}
          </span>
        </div>

        <FormField label="Adjustment Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 text-xs py-1">
            <option value="Physical Audit Count">Physical Audit Count</option>
            <option value="Damaged Goods Write-off">Damaged Goods Write-off</option>
            <option value="Initial Intake">Initial Intake</option>
            <option value="Internal Transfer">Internal Transfer</option>
            <option value="Correction">Data Correction</option>
          </Select>
        </FormField>

        <FormField label="Notes / Reference">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional audit notes or document reference..."
            rows={2}
            className="text-xs"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
