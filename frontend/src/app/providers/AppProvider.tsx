import React, { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ToastProvider, ToastContainer } from '@/features/notifications';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};
