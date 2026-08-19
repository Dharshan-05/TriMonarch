import jwt, { JwtPayload as StandardJwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from '../types';
import { tokenRevocationService } from '../services/tokenRevocation.service';

export interface AuthJwtPayload extends StandardJwtPayload {
  sub: string;
  organizationId: string;
  jti: string;
  iat: number;
  exp: number;
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

export interface SignTokenResult {
  accessToken: string;
  jti: string;
  expiresIn: number;
}

export const signAccessToken = (
  userId: string,
  organizationId: string,
): SignTokenResult => {
  const jti = crypto.randomUUID();
  const expiresIn = 900; // 15 minutes in seconds

  const payload = {
    organizationId,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    subject: userId,
    jwtid: jti,
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return {
    accessToken,
    jti,
    expiresIn,
  };
};

export const verifyAccessToken = async (token: string): Promise<AuthJwtPayload> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;

    if (!decoded.sub || !decoded.organizationId || !decoded.jti) {
      throw new InvalidTokenError('Authentication token missing required claims');
    }

    const isRevoked = await tokenRevocationService.isTokenRevoked(decoded.jti);
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
