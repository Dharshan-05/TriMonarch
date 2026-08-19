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

  logout = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    await authService.logout(req.auth.jti, req.auth.userId, req.auth.organizationId, req.id);
    res.status(204).send();
  };
}

export const authController = new AuthController();
