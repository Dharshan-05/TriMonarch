import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SalesDelivery } from '@/services/salesDeliveries.service';
import { AlertTriangle } from 'lucide-react';

interface CancelSalesDeliveryModalProps {
  delivery: SalesDelivery | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const CancelSalesDeliveryModal: React.FC<CancelSalesDeliveryModalProps> = ({
  delivery,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!delivery) return null;

  const handleCancel = async () => {
    await onConfirm(delivery.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Cancel Sales Delivery
        </span>
      }
      description={
        <span>
          Are you sure you want to cancel delivery dispatch{' '}
          <span className="font-mono font-bold text-foreground">{delivery.delivery_number}</span>?
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
          Cancelling this delivery will stop warehouse picking and shipping operations for this dispatch record.
        </p>
      </div>
    </Dialog>
  );
};
