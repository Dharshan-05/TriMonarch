import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../types/api';
import { AuthenticationError } from '../utils/jwt';

export class AuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.id);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken, req.id);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    const user = await authService.getCurrentUser(req.auth.userId, req.auth.organizationId);
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  status = async (req: Request, res: Response): Promise<void> => {
    const auth = req.auth;
    const statusData = auth
      ? { authenticated: true, userId: auth.userId, organizationId: auth.organizationId }
      : { authenticated: false };

    const response: ApiResponse<typeof statusData> = {
      success: true,
      data: statusData,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    const refreshToken = req.body?.refreshToken;
    await authService.logout(
      req.auth.jti || '',
      req.auth.userId,
      req.auth.organizationId,
      req.id,
      undefined,
      refreshToken,
    );
    res.status(204).send();
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    await authService.logoutAll(req.auth.userId, req.auth.organizationId, req.id);
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Successfully logged out from all active sessions' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const authController = new AuthController();
