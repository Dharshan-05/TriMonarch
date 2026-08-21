import { Request, Response } from 'express';
import { supplierInvoiceService } from '../services/supplierInvoice.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createSupplierInvoiceSchema,
  createSupplierInvoiceItemSchema,
  updateSupplierInvoiceItemSchema,
  listSupplierInvoicesQuerySchema,
  supplierInvoiceParamsSchema,
  supplierInvoiceItemParamsSchema,
  supplierInvoicesBySupplierParamsSchema,
} from '../schemas/supplierInvoice.schema';
import { ValidationError } from '../types';

export class SupplierInvoiceController {
  createInvoice = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = createSupplierInvoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const invoice = await supplierInvoiceService.createInvoice(
      {
        ...parseResult.data,
        organization_id: organizationId,
      },
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: invoice,
    });
  });

  getInvoice = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await supplierInvoiceService.getInvoice(organizationId, paramsResult.data.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  listInvoices = asyncHandler(async (req: Request, res: Response) => {
    const queryResult = listSupplierInvoicesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await supplierInvoiceService.listInvoices(organizationId, queryResult.data);

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

  addItem = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = createSupplierInvoiceItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const item = await supplierInvoiceService.addItem(
      organizationId,
      paramsResult.data.id,
      bodyResult.data,
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: item,
    });
  });

  updateItem = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceItemParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = updateSupplierInvoiceItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const item = await supplierInvoiceService.updateItem(
      organizationId,
      paramsResult.data.id,
      paramsResult.data.itemId,
      bodyResult.data,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      data: item,
    });
  });

  removeItem = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceItemParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    await supplierInvoiceService.removeItem(
      organizationId,
      paramsResult.data.id,
      paramsResult.data.itemId,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      message: 'Supplier invoice item removed successfully',
    });
  });

  postInvoice = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const invoice = await supplierInvoiceService.postInvoice(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: invoice });
  });

  cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoiceParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const invoice = await supplierInvoiceService.cancelInvoice(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: invoice });
  });

  getSupplierInvoices = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoicesBySupplierParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const invoices = await supplierInvoiceService.listInvoices(organizationId, {
      supplier_id: paramsResult.data.supplierId,
    });

    res.status(200).json({ success: true, data: invoices.items });
  });
}

export const supplierInvoiceController = new SupplierInvoiceController();
