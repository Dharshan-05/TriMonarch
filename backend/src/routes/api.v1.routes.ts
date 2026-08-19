import { Router } from 'express';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import departmentRoutes from './department.routes';
import employeeRoutes from './employee.routes';
import productRoutes from './product.routes';
import warehouseRoutes from './warehouse.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import supplierRoutes from './supplier.routes';
import auditRoutes from './audit.routes';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getOpenApiSpec } from '../docs/openapi';

const router = Router();

// Public Endpoints
router.get('/docs', (_req, res) => {
  res.status(200).json(getOpenApiSpec());
});
router.use('/auth', authRoutes);

// Protected ERP Domain & Audit Routes
router.use('/organizations', asyncHandler(requireAuth), organizationRoutes);
router.use('/users', asyncHandler(requireAuth), userRoutes);
router.use('/roles', asyncHandler(requireAuth), roleRoutes);
router.use('/departments', asyncHandler(requireAuth), departmentRoutes);
router.use('/employees', asyncHandler(requireAuth), employeeRoutes);
router.use('/products', asyncHandler(requireAuth), productRoutes);
router.use('/warehouses', asyncHandler(requireAuth), warehouseRoutes);
router.use('/inventory', asyncHandler(requireAuth), inventoryRoutes);
router.use('/customers', asyncHandler(requireAuth), customerRoutes);
router.use('/suppliers', asyncHandler(requireAuth), supplierRoutes);
router.use('/audit', asyncHandler(requireAuth), auditRoutes);

export default router;
