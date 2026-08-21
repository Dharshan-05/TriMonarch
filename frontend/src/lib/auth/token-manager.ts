/**
 * Token Manager for secure Access and Refresh token storage and retrieval.
 */

let inMemoryAccessToken: string | null = null;

const ACCESS_TOKEN_KEY = 'erp_access_token';
const REFRESH_TOKEN_KEY = 'erp_refresh_token';

export const tokenManager = {
  getAccessToken: (): string | null => {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        inMemoryAccessToken = stored;
        return stored;
      }
    }
    return null;
  },

  setAccessToken: (token: string | null): void => {
    inMemoryAccessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  setRefreshToken: (token: string | null): void => {
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  },

  clearTokens: (): void => {
    inMemoryAccessToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
