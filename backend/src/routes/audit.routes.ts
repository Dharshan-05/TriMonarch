import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { validateRequest } from '../middleware/validation';
import { idParamSchema } from '../schemas/common.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(auditController.listAuditLogs));
router.get('/:id', validateRequest({ params: idParamSchema }), asyncHandler(auditController.getAuditLogById));

export default router;
