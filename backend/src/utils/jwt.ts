import jwt, { JwtPayload as StandardJwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from '../types';
import { tokenRevocationService } from '../services/tokenRevocation.service';

export interface AuthJwtPayload extends StandardJwtPayload {
  sub: string;
  organizationId: string;
  jti: string;
  type?: 'access' | 'refresh';
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTHENTICATION_REQUIRED') {
    super(message, 401, code);
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Invalid authentication token') {
    super(message, 'INVALID_TOKEN');
  }
}

export class ExpiredTokenError extends AuthenticationError {
  constructor(message = 'Authentication token has expired') {
    super(message, 'TOKEN_EXPIRED');
  }
}

export class RevokedTokenError extends AuthenticationError {
  constructor(message = 'Authentication token has been revoked') {
    super(message, 'TOKEN_REVOKED');
  }
}

export class InvalidTokenTypeError extends AuthenticationError {
  constructor(message = 'Invalid token type') {
    super(message, 'INVALID_TOKEN_TYPE');
  }
}

export class InvalidIssuerError extends AuthenticationError {
  constructor(message = 'Invalid token issuer') {
    super(message, 'INVALID_ISSUER');
  }
}

export class InvalidAudienceError extends AuthenticationError {
  constructor(message = 'Invalid token audience') {
    super(message, 'INVALID_AUDIENCE');
  }
}

export interface SignTokenResult {
  accessToken: string;
  jti: string;
  expiresIn: number;
}

export interface SignRefreshTokenResult {
  refreshToken: string;
  jti: string;
  expiresIn: number;
}

export const parseExpiresInToSeconds = (expStr: string): number => {
  if (expStr.endsWith('s')) return parseInt(expStr, 10);
  if (expStr.endsWith('m')) return parseInt(expStr, 10) * 60;
  if (expStr.endsWith('h')) return parseInt(expStr, 10) * 3600;
  if (expStr.endsWith('d')) return parseInt(expStr, 10) * 86400;
  return parseInt(expStr, 10) || 900;
};

export const signAccessToken = (
  userId: string,
  organizationId: string,
): SignTokenResult => {
  const jti = crypto.randomUUID();
  const expStr = env.JWT_ACCESS_EXPIRES_IN || env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
  const expiresIn = parseExpiresInToSeconds(expStr);

  const payload = {
    organizationId,
    type: 'access',
  };

  const secret = env.JWT_ACCESS_SECRET || env.JWT_SECRET;
  const accessToken = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    subject: userId,
    jwtid: jti,
    issuer: env.JWT_ISSUER || 'trimonarch-erp',
    audience: env.JWT_AUDIENCE || 'trimonarch-api',
    expiresIn: expStr as jwt.SignOptions['expiresIn'],
  });

  return {
    accessToken,
    jti,
    expiresIn,
  };
};

export const signRefreshToken = (
  userId: string,
  organizationId: string,
): SignRefreshTokenResult => {
  const jti = crypto.randomUUID();
  const expStr = env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresIn = parseExpiresInToSeconds(expStr);

  const payload = {
    organizationId,
    type: 'refresh',
  };

  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;
  const refreshToken = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    subject: userId,
    jwtid: jti,
    issuer: env.JWT_ISSUER || 'trimonarch-erp',
    audience: env.JWT_AUDIENCE || 'trimonarch-api',
    expiresIn: expStr as jwt.SignOptions['expiresIn'],
  });

  return {
    refreshToken,
    jti,
    expiresIn,
  };
};

export const verifyAccessToken = async (token: string): Promise<AuthJwtPayload> => {
  try {
    const secretsToTry = [env.JWT_ACCESS_SECRET, env.JWT_SECRET].filter(Boolean);
    let decoded: AuthJwtPayload | null = null;
    let lastErr: unknown = null;

    for (const secret of secretsToTry) {
      try {
        decoded = jwt.verify(token, secret, {
          algorithms: ['HS256'],
        }) as AuthJwtPayload;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!decoded) {
      throw lastErr;
    }

    if (!decoded.sub || !decoded.organizationId || !decoded.jti) {
      throw new InvalidTokenError('Authentication token missing required claims');
    }

    if (decoded.type && decoded.type !== 'access') {
      throw new InvalidTokenTypeError('Token is not an access token');
    }

    const expectedIssuer = env.JWT_ISSUER || 'trimonarch-erp';
    if (decoded.iss && decoded.iss !== expectedIssuer) {
      throw new InvalidIssuerError(`Token issuer '${decoded.iss}' does not match expected issuer`);
    }

    const expectedAudience = env.JWT_AUDIENCE || 'trimonarch-api';
    if (decoded.aud && decoded.aud !== expectedAudience) {
      throw new InvalidAudienceError(`Token audience '${decoded.aud}' does not match expected audience`);
    }

    const isRevoked = await tokenRevocationService.isTokenRevoked(decoded.jti, decoded.sub);
    if (isRevoked) {
      throw new RevokedTokenError();
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredTokenError();
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError(error.message);
    }
    throw new InvalidTokenError();
  }
};

export const verifyRefreshToken = async (token: string): Promise<AuthJwtPayload> => {
  try {
    const secretsToTry = [env.JWT_REFRESH_SECRET, env.JWT_SECRET].filter(Boolean);
    let decoded: AuthJwtPayload | null = null;
    let lastErr: unknown = null;

    for (const secret of secretsToTry) {
      try {
        decoded = jwt.verify(token, secret, {
          algorithms: ['HS256'],
        }) as AuthJwtPayload;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!decoded) {
      throw lastErr;
    }

    if (!decoded.sub || !decoded.organizationId || !decoded.jti) {
      throw new InvalidTokenError('Refresh token missing required claims');
    }

    if (decoded.type !== 'refresh') {
      throw new InvalidTokenTypeError('Token is not a refresh token');
    }

    const expectedIssuer = env.JWT_ISSUER || 'trimonarch-erp';
    if (decoded.iss && decoded.iss !== expectedIssuer) {
      throw new InvalidIssuerError(`Refresh token issuer '${decoded.iss}' does not match expected issuer`);
    }

    const expectedAudience = env.JWT_AUDIENCE || 'trimonarch-api';
    if (decoded.aud && decoded.aud !== expectedAudience) {
      throw new InvalidAudienceError(`Refresh token audience '${decoded.aud}' does not match expected audience`);
    }

    const isRevoked = await tokenRevocationService.isTokenRevoked(decoded.jti, decoded.sub);
    if (isRevoked) {
      throw new RevokedTokenError('Refresh token has been revoked');
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredTokenError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError(error.message);
    }
    throw new InvalidTokenError('Invalid refresh token');
  }
};
