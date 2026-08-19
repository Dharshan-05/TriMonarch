import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.get(
  '/me',
  asyncHandler(requireAuth),
  asyncHandler(authController.me),
);

router.post(
  '/logout',
  asyncHandler(requireAuth),
  asyncHandler(authController.logout),
);

export default router;
