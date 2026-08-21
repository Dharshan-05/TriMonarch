import crypto from 'crypto';
import { PoolClient } from 'pg';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../utils/password';
import { userRepository } from '../repositories/user.repository';
import { businessEventService } from './businessEvent.service';
import { AuthenticationError } from '../utils/jwt';
import { NotFoundError, ValidationError } from '../types';
import { changePasswordSchema, resetPasswordConfirmSchema } from '../schemas/password.schema';

export interface PasswordResetTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return verifyPassword(password, hash);
  }

  validatePasswordPolicy(password: string): void {
    validatePasswordPolicy(password);
  }

  async changePassword(
    userId: string,
    organizationId: string,
    currentPassword: string,
    newPassword: string,
    client?: PoolClient,
  ): Promise<void> {
    const parseResult = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const user = await userRepository.findById(organizationId, userId, client);
    if (!user) {
      await businessEventService.emit(
        {
          eventName: 'PASSWORD_CHANGE_FAILED',
          organization_id: organizationId,
          user_id: userId,
          reason: 'User not found',
        },
        client,
      );
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const userWithAuth = await userRepository.findByEmailForAuthentication(user.email, client);
    if (!userWithAuth || !userWithAuth.password_hash) {
      await businessEventService.emit(
        {
          eventName: 'PASSWORD_CHANGE_FAILED',
          organization_id: organizationId,
          user_id: userId,
          reason: 'Password hash not found',
        },
        client,
      );
      throw new AuthenticationError('Invalid current password', 'INVALID_CREDENTIALS');
    }

    const isValidCurrent = await this.verifyPassword(currentPassword, userWithAuth.password_hash);
    if (!isValidCurrent) {
      await businessEventService.emit(
        {
          eventName: 'PASSWORD_CHANGE_FAILED',
          organization_id: organizationId,
          user_id: userId,
          reason: 'Invalid current password',
        },
        client,
      );
      throw new AuthenticationError('Invalid current password', 'INVALID_CREDENTIALS');
    }

    const newHash = await this.hashPassword(newPassword);
    await userRepository.updatePasswordHash(userId, newHash, client);

    await businessEventService.emit(
      {
        eventName: 'PASSWORD_CHANGED',
        organization_id: organizationId,
        user_id: userId,
        entity_id: userId,
      },
      client,
    );
  }

  async generatePasswordResetToken(
    email: string,
    client?: PoolClient,
  ): Promise<PasswordResetTokenResult | null> {
    const user = await userRepository.findByEmail(email, client);
    if (!user) {
      return null;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await businessEventService.emit(
      {
        eventName: 'PASSWORD_RESET_REQUESTED',
        organization_id: user.organization_id,
        user_id: user.id,
        entity_id: user.id,
      },
      client,
    );

    return {
      token: rawToken,
      tokenHash,
      expiresAt,
    };
  }

  async confirmPasswordReset(
    userId: string,
    organizationId: string,
    newPassword: string,
    client?: PoolClient,
  ): Promise<void> {
    const parseResult = resetPasswordConfirmSchema.safeParse({ token: 'valid_token', newPassword });
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const newHash = await this.hashPassword(newPassword);
    await userRepository.updatePasswordHash(userId, newHash, client);

    await businessEventService.emit(
      {
        eventName: 'PASSWORD_RESET_COMPLETED',
        organization_id: organizationId,
        user_id: userId,
        entity_id: userId,
      },
      client,
    );
  }
}

export const passwordService = new PasswordService();
