import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/services/users.service';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeactivateModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeactivateModal: React.FC<ConfirmDeactivateModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!user) return null;

  const handleDeactivate = async () => {
    await onConfirm(user.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Deactivate User Account
        </span>
      }
      description={
        <span>
          Are you sure you want to deactivate <span className="font-semibold text-foreground">{user.name}</span> ({user.email})?
        </span>
      }
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeactivate} disabled={isLoading} className="font-semibold">
            {isLoading ? 'Deactivating...' : 'Deactivate User'}
          </Button>
        </>
      }
    >
      <div className="py-2 text-xs text-muted-foreground space-y-2">
        <p>
          Deactivating this user will revoke their access to the Mini ERP platform immediately. Active API tokens will be rendered invalid.
        </p>
      </div>
    </Dialog>
  );
};
