import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { LoadingState } from '@/components/ui/loading-state';
import { Container } from '@/components/ui/container';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center">
        <LoadingState message="Authenticating session..." size="lg" />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
