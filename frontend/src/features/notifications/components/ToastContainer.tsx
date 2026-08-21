import React from 'react';
import { useToast, ToastItem } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const getVariantStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          container: 'border-emerald-500/30 bg-card text-foreground shadow-lg',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          container: 'border-destructive/30 bg-card text-foreground shadow-lg',
          icon: <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />,
          accent: 'bg-destructive',
        };
      case 'warning':
        return {
          container: 'border-amber-500/30 bg-card text-foreground shadow-lg',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          container: 'border-blue-500/30 bg-card text-foreground shadow-lg',
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />,
          accent: 'bg-blue-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto relative flex items-start gap-3 p-3.5 rounded-lg border text-xs transition-all duration-200 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2',
        styles.container,
      )}
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', styles.accent)} />
      
      <div className="pl-1 pt-0.5">{styles.icon}</div>

      <div className="flex-1 space-y-0.5 min-w-0 pr-2">
        {toast.title && <h5 className="font-semibold text-foreground text-xs leading-none">{toast.title}</h5>}
        <p className="text-xs text-muted-foreground leading-relaxed break-words">{toast.message}</p>
      </div>

      {toast.dismissible && (
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
