import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, LoginCredentials } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { tokenManager } from '@/lib/auth/token-manager';
import { queryClient } from '@/app/providers/QueryProvider';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('Session restoration failed:', err);
        tokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const result = await authService.login(credentials);
    tokenManager.setAccessToken(result.accessToken);
    if (result.refreshToken) {
      tokenManager.setRefreshToken(result.refreshToken);
    }
    setUser(result.user);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    const refreshToken = tokenManager.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Safe fallback if logout call fails locally or offline
    } finally {
      tokenManager.clearTokens();
      queryClient.clear(); // Clear private server-state query cache
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
