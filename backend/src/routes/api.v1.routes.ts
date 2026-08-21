import { Router } from 'express';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import partnerRoutes from './partner.routes';
import roleRoutes from './role.routes';
import departmentRoutes from './department.routes';
import employeeRoutes from './employee.routes';
import productRoutes from './product.routes';
import warehouseRoutes from './warehouse.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import supplierRoutes from './supplier.routes';
import auditRoutes from './audit.routes';
import { purchaseOrderRoutes } from './purchaseOrder.routes';
import { purchaseReceiptRoutes } from './purchaseReceipt.routes';
import { purchaseReceiptController } from '../controllers/purchaseReceipt.controller';
import { supplierInvoiceRoutes } from './supplierInvoice.routes';
import { supplierInvoiceController } from '../controllers/supplierInvoice.controller';
import { supplierPaymentRoutes } from './supplierPayment.routes';
import { accountsPayableRoutes } from './accountsPayable.routes';
import { accountsPayableController } from '../controllers/accountsPayable.controller';
import { bomRoutes } from './bom.routes';
import { bomController } from '../controllers/bom.controller';
import { salesDeliveryRoutes } from './salesDelivery.routes';
import { salesDeliveryController } from '../controllers/salesDelivery.controller';
import { manufacturingOrderRoutes } from './manufacturingOrder.routes';
import { manufacturingOrderController } from '../controllers/manufacturingOrder.controller';
import { manufacturingMaterialConsumptionRoutes } from './manufacturingMaterialConsumption.routes';
import { manufacturingProductionRoutes } from './manufacturingProduction.routes';
import salesOrderRoutes from './salesOrder.routes';
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
router.use('/partners', asyncHandler(requireAuth), partnerRoutes);
router.use('/roles', asyncHandler(requireAuth), roleRoutes);
router.use('/departments', asyncHandler(requireAuth), departmentRoutes);
router.use('/employees', asyncHandler(requireAuth), employeeRoutes);
router.use('/products', asyncHandler(requireAuth), productRoutes);
router.get(
  '/products/:productId/boms',
  asyncHandler(requireAuth),
  bomController.getProductBoms,
);
router.get(
  '/products/:productId/manufacturing-orders',
  asyncHandler(requireAuth),
  manufacturingOrderController.getOrdersByProduct,
);
router.use('/boms', asyncHandler(requireAuth), bomRoutes);
router.use('/warehouses', asyncHandler(requireAuth), warehouseRoutes);
router.get(
  '/warehouses/:warehouseId/manufacturing-orders',
  asyncHandler(requireAuth),
  manufacturingOrderController.getOrdersByWarehouse,
);
router.use('/inventory', asyncHandler(requireAuth), inventoryRoutes);
router.use('/customers', asyncHandler(requireAuth), customerRoutes);
router.use('/suppliers', asyncHandler(requireAuth), supplierRoutes);
router.get(
  '/suppliers/:supplierId/invoices',
  asyncHandler(requireAuth),
  supplierInvoiceController.getSupplierInvoices,
);
router.get(
  '/suppliers/:supplierId/payables',
  asyncHandler(requireAuth),
  accountsPayableController.getSupplierPayables,
);
router.use('/audit', asyncHandler(requireAuth), auditRoutes);
router.use('/audits', asyncHandler(requireAuth), auditRoutes);
router.use('/purchase-orders', asyncHandler(requireAuth), purchaseOrderRoutes);
router.get(
  '/purchase-orders/:purchaseOrderId/receipts',
  asyncHandler(requireAuth),
  purchaseReceiptController.getPurchaseOrderReceipts,
);
router.use('/purchase-receipts', asyncHandler(requireAuth), purchaseReceiptRoutes);
router.use('/supplier-invoices', asyncHandler(requireAuth), supplierInvoiceRoutes);
router.use('/supplier-payments', asyncHandler(requireAuth), supplierPaymentRoutes);
router.use('/accounts-payable', asyncHandler(requireAuth), accountsPayableRoutes);
router.use('/sales-orders', asyncHandler(requireAuth), salesOrderRoutes);
router.use('/deliveries', asyncHandler(requireAuth), salesDeliveryRoutes);
router.get(
  '/sales-orders/:salesOrderId/deliveries',
  asyncHandler(requireAuth),
  salesDeliveryController.getSalesOrderDeliveries,
);
router.use('/manufacturing', asyncHandler(requireAuth), manufacturingOrderRoutes);
router.use('/manufacturing-orders', asyncHandler(requireAuth), manufacturingOrderRoutes);
router.use(
  '/manufacturing-material-consumptions',
  asyncHandler(requireAuth),
  manufacturingMaterialConsumptionRoutes,
);
router.use(
  '/manufacturing-productions',
  asyncHandler(requireAuth),
  manufacturingProductionRoutes,
);

export default router;
