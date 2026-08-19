import { userRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/password';
import { signAccessToken, AuthenticationError } from '../utils/jwt';
import { tokenRevocationService } from './tokenRevocation.service';
import { auditService } from '../audit/audit.service';
import { User } from '../types/database';
import { NotFoundError } from '../types';

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export class AuthService {
  async login(email: string, password: string, requestId?: string): Promise<LoginResult> {
    const userWithAuth = await userRepository.findByEmailForAuthentication(email);

    if (!userWithAuth || !userWithAuth.password_hash) {
      if (userWithAuth) {
        await auditService.recordAuditEvent({
          organization_id: userWithAuth.organization_id,
          user_id: userWithAuth.id,
          action: 'AUTH_FAILURE',
          entity_type: 'AUTHENTICATION',
          request_id: requestId,
          success: false,
          metadata: { reason: 'INVALID_CREDENTIALS', email },
        });
      }
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (userWithAuth.status !== 'active') {
      await auditService.recordAuditEvent({
        organization_id: userWithAuth.organization_id,
        user_id: userWithAuth.id,
        action: 'AUTH_FAILURE',
        entity_type: 'AUTHENTICATION',
        request_id: requestId,
        success: false,
        metadata: { reason: 'ACCOUNT_DISABLED', email },
      });
      throw new AuthenticationError('User account is disabled or suspended', 'ACCOUNT_DISABLED');
    }

    const isValidPassword = await verifyPassword(password, userWithAuth.password_hash);
    if (!isValidPassword) {
      await auditService.recordAuditEvent({
        organization_id: userWithAuth.organization_id,
        user_id: userWithAuth.id,
        action: 'AUTH_FAILURE',
        entity_type: 'AUTHENTICATION',
        request_id: requestId,
        success: false,
        metadata: { reason: 'INVALID_CREDENTIALS', email },
      });
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    await userRepository.updateLastLogin(userWithAuth.id);

    const { accessToken, expiresIn } = signAccessToken(
      userWithAuth.id,
      userWithAuth.organization_id,
    );

    // Record LOGIN audit event
    await auditService.recordAuditEvent({
      organization_id: userWithAuth.organization_id,
      user_id: userWithAuth.id,
      action: 'LOGIN',
      entity_type: 'AUTHENTICATION',
      request_id: requestId,
      success: true,
      metadata: { email },
    });

    // Sanitize user object (omit auth fields)
    const { password_hash, password_changed_at, last_login_at, ...publicUser } = userWithAuth;
    void password_hash;
    void password_changed_at;
    void last_login_at;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: publicUser,
    };
  }

  async getCurrentUser(userId: string, organizationId: string): Promise<User> {
    const user = await userRepository.findById(organizationId, userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    return user;
  }

  async logout(
    jti: string,
    userId: string,
    organizationId?: string,
    requestId?: string,
    expSeconds?: number,
  ): Promise<void> {
    const expiresAt = expSeconds ? new Date(expSeconds * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    await tokenRevocationService.revokeToken(jti, userId, expiresAt);

    if (organizationId) {
      await auditService.recordAuditEvent({
        organization_id: organizationId,
        user_id: userId,
        action: 'LOGOUT',
        entity_type: 'AUTHENTICATION',
        request_id: requestId,
        success: true,
      });
    }
  }
}

export const authService = new AuthService();
