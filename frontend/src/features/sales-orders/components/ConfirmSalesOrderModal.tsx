import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SalesOrder } from '@/services/salesOrders.service';
import { formatCurrency } from '@/lib/utils/formatters';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmSalesOrderModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConfirmSalesOrderModal: React.FC<ConfirmSalesOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!order) return null;

  const handleConfirm = async () => {
    await onConfirm(order.id);
    onClose();
  };

  const totalNum = parseFloat(order.total_amount || '0');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <CheckCircle2 className="h-5 w-5" /> Confirm Sales Order
        </span>
      }
      description={
        <span>
          Are you sure you want to confirm sales order{' '}
          <span className="font-mono font-bold text-foreground">{order.order_number}</span>?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={isLoading} className="font-semibold bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Confirming...' : 'Confirm Order'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs space-y-3">
        <div className="p-3 border rounded-lg bg-surface space-y-1 font-mono">
          <div className="flex justify-between text-muted-foreground">
            <span>Customer:</span>
            <span className="font-sans font-semibold text-foreground">{order.customer_name || order.customer_id}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Total Value:</span>
            <span className="font-bold text-foreground">{formatCurrency(totalNum, order.currency)}</span>
          </div>
        </div>

        <p className="text-muted-foreground">
          Confirming this order locks its initial price parameters and signals backend workflows for fulfillment and inventory reservation.
        </p>
      </div>
    </Dialog>
  );
};
