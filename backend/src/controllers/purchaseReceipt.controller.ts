import { Request, Response } from 'express';
import { purchaseReceiptService } from '../services/purchaseReceipt.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createPurchaseReceiptSchema,
  createPurchaseReceiptItemSchema,
  updatePurchaseReceiptItemSchema,
  listPurchaseReceiptsQuerySchema,
  purchaseReceiptParamsSchema,
  purchaseReceiptItemParamsSchema,
  purchaseOrderReceiptParamsSchema,
} from '../schemas/purchaseReceipt.schema';
import { ValidationError } from '../types';

export class PurchaseReceiptController {
  createReceipt = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = createPurchaseReceiptSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const receipt = await purchaseReceiptService.createReceipt(
      {
        ...parseResult.data,
        organization_id: organizationId,
      },
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: receipt,
    });
  });

  getReceipt = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = purchaseReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await purchaseReceiptService.getReceipt(organizationId, paramsResult.data.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  listReceipts = asyncHandler(async (req: Request, res: Response) => {
    const queryResult = listPurchaseReceiptsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await purchaseReceiptService.listReceipts(organizationId, queryResult.data);

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
    const paramsResult = purchaseReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = createPurchaseReceiptItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const item = await purchaseReceiptService.addItem(
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
    const paramsResult = purchaseReceiptItemParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = updatePurchaseReceiptItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const item = await purchaseReceiptService.updateItem(
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
    const paramsResult = purchaseReceiptItemParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    await purchaseReceiptService.removeItem(
      organizationId,
      paramsResult.data.id,
      paramsResult.data.itemId,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      message: 'Purchase receipt item removed successfully',
    });
  });

  postReceipt = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = purchaseReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const receipt = await purchaseReceiptService.postReceipt(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: receipt });
  });

  completeReceipt = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = purchaseReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const receipt = await purchaseReceiptService.completeReceipt(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: receipt });
  });

  cancelReceipt = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = purchaseReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const receipt = await purchaseReceiptService.cancelReceipt(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: receipt });
  });

  getPurchaseOrderReceipts = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = purchaseOrderReceiptParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const receipts = await purchaseReceiptService.getPurchaseOrderReceipts(
      organizationId,
      paramsResult.data.purchaseOrderId,
    );

    res.status(200).json({ success: true, data: receipts });
  });
}

export const purchaseReceiptController = new PurchaseReceiptController();
