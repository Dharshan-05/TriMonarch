import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export type AddToastOptions = Omit<ToastItem, 'id' | 'type' | 'message'>;

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, title?: string, options?: AddToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  notify: {
    success: (message: string, title?: string, options?: AddToastOptions) => string;
    error: (message: string, title?: string, options?: AddToastOptions) => string;
    warning: (message: string, title?: string, options?: AddToastOptions) => string;
    info: (message: string, title?: string, options?: AddToastOptions) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const dummyFallback: ToastContextValue = {
  toasts: [],
  addToast: () => 'noop-id',
  removeToast: () => {},
  clearToasts: () => {},
  notify: {
    success: () => 'noop-id',
    error: () => 'noop-id',
    warning: () => 'noop-id',
    info: () => 'noop-id',
  },
};

export interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, options?: AddToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        message,
        title,
        duration: options?.duration ?? 4000,
        dismissible: options?.dismissible ?? true,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 visible toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast],
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const notify = {
    success: useCallback(
      (message: string, title?: string, options?: AddToastOptions) =>
        addToast('success', message, title ?? 'Success', options),
      [addToast],
    ),
    error: useCallback(
      (message: string, title?: string, options?: AddToastOptions) =>
        addToast('error', message, title ?? 'Error', options),
      [addToast],
    ),
    warning: useCallback(
      (message: string, title?: string, options?: AddToastOptions) =>
        addToast('warning', message, title ?? 'Warning', options),
      [addToast],
    ),
    info: useCallback(
      (message: string, title?: string, options?: AddToastOptions) =>
        addToast('info', message, title ?? 'Information', options),
      [addToast],
    ),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, notify }}>
      {children}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  return context || dummyFallback;
};
