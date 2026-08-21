import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Specialized Audit Discovery & Aggregation Endpoints (Must be mounted before /:id)
router.get('/events', requirePermission('audit:read'), asyncHandler(auditController.getAvailableEvents));
router.get('/stats', requirePermission('audit:read'), asyncHandler(auditController.getStats));
router.get('/export', requirePermission('audit:export'), asyncHandler(auditController.exportAuditLogs));

// Specialized Entity & Actor History Endpoints
router.get('/actor/:userId', requirePermission('audit:read'), asyncHandler(auditController.getActorAuditHistory));
router.get('/resource/:resource/:resourceId', requirePermission('audit:read'), asyncHandler(auditController.getResourceAuditHistory));
router.get('/entity/:entityType/:entityId', requirePermission('audit:read'), asyncHandler(auditController.getEntityAuditHistory));

// Primary Audit Listing & Retrieval Endpoints
router.get('/', requirePermission('audit:read'), asyncHandler(auditController.listAuditLogs));
router.get('/:id', requirePermission('audit:read'), asyncHandler(auditController.getAuditLogById));

// Note: Immutability Guard — NO PATCH, PUT, or DELETE routes are mounted.
// Any mutation attempt will naturally result in HTTP 404 Not Found.

export default router;
export const auditRoutes = router;
