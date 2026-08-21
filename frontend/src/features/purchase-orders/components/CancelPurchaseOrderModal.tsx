import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseOrder } from '@/services/purchaseOrders.service';
import { AlertTriangle } from 'lucide-react';

interface CancelPurchaseOrderModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const CancelPurchaseOrderModal: React.FC<CancelPurchaseOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!order) return null;

  const handleCancel = async () => {
    await onConfirm(order.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Cancel Purchase Order
        </span>
      }
      description={
        <span>
          Are you sure you want to cancel purchase order{' '}
          <span className="font-mono font-bold text-foreground">{order.order_number}</span>?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Keep Active
          </Button>
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          Cancelling this purchase order will stop vendor fulfillment and release pending procurement requests.
        </p>
      </div>
    </Dialog>
  );
};
