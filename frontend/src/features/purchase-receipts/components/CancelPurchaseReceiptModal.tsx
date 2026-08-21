import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseReceipt } from '@/services/purchaseReceipts.service';
import { AlertTriangle } from 'lucide-react';

interface CancelPurchaseReceiptModalProps {
  receipt: PurchaseReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const CancelPurchaseReceiptModal: React.FC<CancelPurchaseReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!receipt) return null;

  const handleCancel = async () => {
    await onConfirm(receipt.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Cancel Purchase Goods Receipt
        </span>
      }
      description={
        <span>
          Are you sure you want to cancel goods receipt{' '}
          <span className="font-mono font-bold text-foreground">{receipt.receipt_number}</span>?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Keep Draft
          </Button>
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          Cancelling a draft receipt voids the pending warehouse entry before physical stock is posted into inventory.
        </p>
      </div>
    </Dialog>
  );
};
