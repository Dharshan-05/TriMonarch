import { Request, Response, NextFunction } from 'express';
import { authorizationService } from '../services/authorization.service';
import { AuthenticationRequiredError, InsufficientPermissionsError } from '../errors/authentication.errors';
import { StandardPermission } from '../types/rbac';

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      return next(new AuthenticationRequiredError());
    }

    try {
      const roles = req.auth.roles || (await authorizationService.getUserRoles(req.auth.userId));
      req.auth.roles = roles;

      if (!authorizationService.hasAnyRole(roles, allowedRoles)) {
        return next(new InsufficientPermissionsError('Insufficient role privileges'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (...requiredPermissions: StandardPermission[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      return next(new AuthenticationRequiredError());
    }

    try {
      const roles = req.auth.roles || (await authorizationService.getUserRoles(req.auth.userId));
      req.auth.roles = roles;

      if (!authorizationService.hasAnyPermission(roles, requiredPermissions)) {
        return next(new InsufficientPermissionsError('Insufficient permissions to perform this action'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
