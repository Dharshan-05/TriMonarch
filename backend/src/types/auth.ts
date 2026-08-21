export interface AuthContext {
  userId: string;
  organizationId: string;
  jti?: string;
  roles?: string[];
}

export type AuthenticationState = 'UNAUTHENTICATED' | 'AUTHENTICATED';

export type UserAuthenticationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface AuthenticationCredentials {
  email: string;
  password?: string;
}

export interface AuthenticationResult {
  authenticated: boolean;
  context?: AuthContext;
  error?: string;
}
