import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthenticationError, InvalidTokenError } from '../utils/jwt';

export interface AuthContext {
  userId: string;
  organizationId: string;
  jti: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new InvalidTokenError('Authorization header must follow Bearer <token> format');
    }

    const token = parts[1];
    const decoded = await verifyAccessToken(token);

    req.auth = {
      userId: decoded.sub,
      organizationId: decoded.organizationId,
      jti: decoded.jti,
    };

    next();
  } catch (error) {
    next(error);
  }
};
