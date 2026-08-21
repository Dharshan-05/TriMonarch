import { userRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  AuthenticationError,
} from '../utils/jwt';
import { tokenRevocationService } from './tokenRevocation.service';
import { businessEventService } from './businessEvent.service';
import { User } from '../types/database';
import { NotFoundError } from '../types';
import { AuthContext } from '../types/auth';
import { UserAuthenticationDisabledError } from '../errors/authentication.errors';

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export class AuthService {
  getAuthenticationContext(user: User, jti?: string): AuthContext {
    return {
      userId: user.id,
      organizationId: user.organization_id,
      jti,
    };
  }

  validateUserStatus(user: User): void {
    if (user.status !== 'active') {
      throw new UserAuthenticationDisabledError('User account is disabled or suspended');
    }
  }

  async login(email: string, password: string, requestId?: string): Promise<LoginResult> {
    const userWithAuth = await userRepository.findByEmailForAuthentication(email);

    if (!userWithAuth || !userWithAuth.password_hash) {
      if (userWithAuth) {
        await businessEventService.emit({
          eventName: 'LOGIN_FAILED',
          organization_id: userWithAuth.organization_id,
          user_id: userWithAuth.id,
          request_id: requestId,
          metadata: { reason: 'INVALID_CREDENTIALS', email },
        });
      }
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (userWithAuth.status !== 'active') {
      await businessEventService.emit({
        eventName: 'LOGIN_FAILED',
        organization_id: userWithAuth.organization_id,
        user_id: userWithAuth.id,
        request_id: requestId,
        metadata: { reason: 'ACCOUNT_DISABLED', email },
      });
      throw new UserAuthenticationDisabledError('User account is disabled or suspended');
    }

    const isValidPassword = await verifyPassword(password, userWithAuth.password_hash);
    if (!isValidPassword) {
      await businessEventService.emit({
        eventName: 'LOGIN_FAILED',
        organization_id: userWithAuth.organization_id,
        user_id: userWithAuth.id,
        request_id: requestId,
        metadata: { reason: 'INVALID_CREDENTIALS', email },
      });
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    await userRepository.updateLastLogin(userWithAuth.id);

    const { accessToken, expiresIn } = signAccessToken(
      userWithAuth.id,
      userWithAuth.organization_id,
    );
    const { refreshToken } = signRefreshToken(
      userWithAuth.id,
      userWithAuth.organization_id,
    );

    // Record LOGIN_SUCCESS business event
    await businessEventService.emit({
      eventName: 'LOGIN_SUCCESS',
      organization_id: userWithAuth.organization_id,
      user_id: userWithAuth.id,
      request_id: requestId,
      metadata: { email },
    });

    // Sanitize user object (omit auth fields)
    const { password_hash, password_changed_at, last_login_at, ...publicUser } = userWithAuth;
    void password_hash;
    void password_changed_at;
    void last_login_at;

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      user: publicUser,
    };
  }

  async refreshToken(refreshTokenInput: string, _requestId?: string): Promise<LoginResult> {
    const decoded = await verifyRefreshToken(refreshTokenInput);
    const user = await userRepository.findById(decoded.organizationId, decoded.sub);
    if (!user) {
      throw new NotFoundError(`User with ID ${decoded.sub} not found`);
    }
    this.validateUserStatus(user);

    // Revoke old refresh token JTI (refresh token rotation)
    const expSeconds = decoded.exp || Math.floor(Date.now() / 1000) + 7 * 86400;
    const expiresAt = new Date(expSeconds * 1000);
    await tokenRevocationService.revokeToken(decoded.jti, decoded.sub, expiresAt);

    // Issue new access and refresh tokens
    const { accessToken, expiresIn } = signAccessToken(user.id, user.organization_id);
    const { refreshToken } = signRefreshToken(user.id, user.organization_id);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      user,
    };
  }

  async getCurrentUser(userId: string, organizationId: string): Promise<User & { roles: string[] }> {
    const user = await userRepository.findById(organizationId, userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    this.validateUserStatus(user);
    const { authorizationService } = await import('./authorization.service');
    const roles = await authorizationService.getUserRoles(userId);
    return { ...user, roles };
  }

  async logout(
    jti: string,
    userId: string,
    organizationId?: string,
    requestId?: string,
    expSeconds?: number,
    refreshTokenInput?: string,
  ): Promise<void> {
    const expiresAt = expSeconds ? new Date(expSeconds * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    if (jti) {
      await tokenRevocationService.revokeToken(jti, userId, expiresAt);
    }

    if (refreshTokenInput) {
      try {
        const decodedRefresh = await verifyRefreshToken(refreshTokenInput);
        const refreshExpiresAt = decodedRefresh.exp
          ? new Date(decodedRefresh.exp * 1000)
          : new Date(Date.now() + 7 * 86400 * 1000);
        await tokenRevocationService.revokeToken(decodedRefresh.jti, userId, refreshExpiresAt);
      } catch {
        // Safe fallback if refresh token is already expired or revoked
      }
    }

    if (organizationId) {
      await businessEventService.emit({
        eventName: 'LOGOUT',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
      });
    }
  }

  async logoutAll(
    userId: string,
    organizationId?: string,
    requestId?: string,
  ): Promise<void> {
    await tokenRevocationService.revokeAllUserTokens(userId);

    if (organizationId) {
      await businessEventService.emit({
        eventName: 'LOGOUT',
        organization_id: organizationId,
        user_id: userId,
        request_id: requestId,
        metadata: { scope: 'ALL_SESSIONS' },
      });
    }
  }
}

export const authService = new AuthService();
