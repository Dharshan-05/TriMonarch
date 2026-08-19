import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../src/utils/password';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';
import * as userRepositoryModule from '../src/repositories/user.repository';
import { tokenRevocationService } from '../src/services/tokenRevocation.service';
import { ValidationError } from '../src/types';

describe('Authentication & Identity Layer', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';

  describe('Password Utility', () => {
    it('should hash and verify passwords correctly', async () => {
      const plain = 'SecurePassword123!';
      const hash = await hashPassword(plain);

      expect(hash).not.toBe(plain);
      expect(await verifyPassword(plain, hash)).toBe(true);
      expect(await verifyPassword('WrongPassword!', hash)).toBe(false);
    });

    it('should generate distinct hashes for identical passwords due to salting', async () => {
      const pass = 'IdenticalPassword123!';
      const hash1 = await hashPassword(pass);
      const hash2 = await hashPassword(pass);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(pass, hash1)).toBe(true);
      expect(await verifyPassword(pass, hash2)).toBe(true);
    });

    it('should enforce password length policy limits', () => {
      expect(() => validatePasswordPolicy('short')).toThrow(ValidationError);
      expect(() => validatePasswordPolicy('a'.repeat(129))).toThrow(ValidationError);
      expect(() => validatePasswordPolicy('ValidPass123!')).not.toThrow();
    });
  });

  describe('JWT Utility', () => {
    it('should sign and verify access tokens with valid claims', async () => {
      const { accessToken, jti } = signAccessToken(userAId, orgAId);
      const decoded = await verifyAccessToken(accessToken);

      expect(decoded.sub).toBe(userAId);
      expect(decoded.organizationId).toBe(orgAId);
      expect(decoded.jti).toBe(jti);
    });

    it('should reject invalid or tampered tokens', async () => {
      const { accessToken } = signAccessToken(userAId, orgAId);
      const tampered = accessToken + 'tampered';

      await expect(verifyAccessToken(tampered)).rejects.toThrow();
    });
  });

  describe('Login API Endpoint (POST /api/v1/auth/login)', () => {
    it('should authenticate valid active credentials and return JWT token', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await hashPassword(plainPassword);

      const mockUserWithAuth = {
        id: userAId,
        organization_id: orgAId,
        name: 'Admin User',
        email: 'admin@acme.com',
        phone: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: hashedPassword,
        password_changed_at: null,
        last_login_at: null,
      };

      vi.spyOn(userRepositoryModule.userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUserWithAuth);
      vi.spyOn(userRepositoryModule.userRepository, 'updateLastLogin').mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@acme.com', password: plainPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.user.email).toBe('admin@acme.com');
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 401 for incorrect password without revealing account detail', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      const mockUser = {
        id: userAId,
        organization_id: orgAId,
        name: 'Admin User',
        email: 'admin@acme.com',
        phone: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: hashedPassword,
        password_changed_at: null,
        last_login_at: null,
      };

      vi.spyOn(userRepositoryModule.userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@acme.com', password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 401 for disabled/inactive accounts', async () => {
      const hashedPassword = await hashPassword('Password123!');
      const mockDisabledUser = {
        id: userAId,
        organization_id: orgAId,
        name: 'Disabled User',
        email: 'disabled@acme.com',
        phone: null,
        status: 'inactive' as const,
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: hashedPassword,
        password_changed_at: null,
        last_login_at: null,
      };

      vi.spyOn(userRepositoryModule.userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockDisabledUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'disabled@acme.com', password: 'Password123!' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
    });
  });

  describe('Protected Endpoints (/api/v1/auth/me & /api/v1/auth/logout)', () => {
    it('GET /api/v1/auth/me should return current authenticated user profile', async () => {
      const { accessToken } = signAccessToken(userAId, orgAId);

      const mockUser = {
        id: userAId,
        organization_id: orgAId,
        name: 'Admin User',
        email: 'admin@acme.com',
        phone: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(userRepositoryModule.userRepository, 'findById').mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(userAId);
      expect(response.body.data.email).toBe('admin@acme.com');
    });

    it('POST /api/v1/auth/logout should revoke token and reject subsequent reuse', async () => {
      const { accessToken, jti } = signAccessToken(userAId, orgAId);

      vi.spyOn(tokenRevocationService, 'revokeToken').mockImplementationOnce(async () => {
        vi.spyOn(tokenRevocationService, 'isTokenRevoked').mockImplementation(async (checkJti) => checkJti === jti);
      });

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutResponse.status).toBe(204);

      // Attempt to reuse revoked token
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(401);
      expect(meResponse.body.error.code).toBe('TOKEN_REVOKED');
    });
  });

  describe('Multi-Tenant / Organization Isolation Enforcement', () => {
    it('should reject requests attempting to access Organization B data using an Organization A token', async () => {
      // Authenticate token for Organization A
      const { accessToken } = signAccessToken(userAId, orgAId);

      // Attempt to pass x-organization-id for Organization B
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-organization-id', orgBId);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Cross-organization access denied');
    });
  });
});
