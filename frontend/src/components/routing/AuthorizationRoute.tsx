import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { AccessRequirement } from '@/features/authorization/types/authorization.types';
import { LoadingState } from '@/components/ui/loading-state';

interface AuthorizationRouteProps {
  access?: AccessRequirement;
}

export const AuthorizationRoute: React.FC<AuthorizationRouteProps> = ({ access }) => {
  const { isInitializing } = useAuth();
  const { canAccess } = useAuthorization();

  if (isInitializing) {
    return <LoadingState message="Checking authorization..." size="sm" />;
  }

  if (!canAccess(access)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
