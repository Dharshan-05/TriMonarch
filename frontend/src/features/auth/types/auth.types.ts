export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  organization_id: string;
  status: 'active' | 'inactive' | 'suspended';
  roles?: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
}
