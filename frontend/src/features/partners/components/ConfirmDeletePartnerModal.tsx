import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Partner } from '@/services/partners.service';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeletePartnerModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, type: Partner['type']) => Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeletePartnerModal: React.FC<ConfirmDeletePartnerModalProps> = ({
  partner,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!partner) return null;

  const handleDelete = async () => {
    await onConfirm(partner.id, partner.type);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Delete Partner Record
        </span>
      }
      description={
        <span>
          Are you sure you want to delete <span className="font-semibold text-foreground">{partner.name}</span>?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Deleting...' : 'Delete Partner'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          This action will remove or soft-delete the business partner record. Active sales or purchase transactions associated with this partner will remain preserved for audit compliance.
        </p>
      </div>
    </Dialog>
  );
};
