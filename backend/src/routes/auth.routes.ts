import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createRateLimiter } from '../middleware/rateLimit';
import { loginSchema, refreshTokenSchema, logoutSchema } from '../schemas/auth.schema';

const router = Router();

// Strict rate limiter for sensitive authentication endpoints (login & refresh)
const authLimiter = createRateLimiter({ windowMs: 900000, maxRequests: 20 });

router.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  authLimiter,
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh),
);

router.get(
  '/me',
  asyncHandler(requireAuth),
  asyncHandler(authController.me),
);

router.get(
  '/status',
  asyncHandler(authController.status),
);

router.post(
  '/logout',
  asyncHandler(requireAuth),
  validateRequest({ body: logoutSchema }),
  asyncHandler(authController.logout),
);

router.post(
  '/logout-all',
  asyncHandler(requireAuth),
  asyncHandler(authController.logoutAll),
);

export default router;
