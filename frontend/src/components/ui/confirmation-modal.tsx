import React from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'default';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isLoading = false,
  children,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-primary flex-shrink-0" />;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className={variant === 'destructive' ? 'text-destructive font-bold' : 'text-foreground font-bold'}>
            {title}
          </span>
        </div>
      }
      description={description}
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="h-10 sm:h-8 text-xs min-h-[44px] sm:min-h-[32px]">
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-10 sm:h-8 text-xs font-semibold min-h-[44px] sm:min-h-[32px]"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      }
    >
      {children && <div className="py-2 text-xs text-muted-foreground">{children}</div>}
    </Dialog>
  );
};
