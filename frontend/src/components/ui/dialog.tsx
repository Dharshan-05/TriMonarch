import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}) => {
  const dialogId = React.useId();
  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-desc`;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg border bg-background p-5 sm:p-6 shadow-elevation animate-in fade-in-90 zoom-in-95 my-auto max-h-[90vh] flex flex-col',
          className,
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {title && (
          <div className="mb-3 pr-8 flex-shrink-0">
            <h3 id={titleId} className="text-base sm:text-lg font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h3>
            {description && (
              <p id={descId} className="mt-1 text-xs sm:text-sm text-muted-foreground leading-normal">{description}</p>
            )}
          </div>
        )}

        <div className="py-2 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="mt-5 pt-3 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
