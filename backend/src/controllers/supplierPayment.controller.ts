import { Request, Response } from 'express';
import { supplierPaymentService } from '../services/supplierPayment.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import {
  recordSupplierPaymentSchema,
  listSupplierPaymentsQuerySchema,
} from '../schemas/supplierPayment.schema';
import { supplierInvoiceParamsSchema } from '../schemas/supplierInvoice.schema';
import { ValidationError } from '../types';

export class SupplierPaymentController {
  recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = recordSupplierPaymentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const result = await supplierPaymentService.recordPayment(
      {
        ...bodyResult.data,
        organization_id: organizationId,
        supplier_invoice_id: paramsResult.data.id,
      },
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  listInvoicePayments = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const payments = await supplierPaymentService.listInvoicePayments(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: payments,
    });
  });

  listPayments = asyncHandler(async (req: Request, res: Response) => {
    const queryResult = listSupplierPaymentsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await supplierPaymentService.listPayments(organizationId, queryResult.data);

    res.status(200).json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  });
}

export const supplierPaymentController = new SupplierPaymentController();
