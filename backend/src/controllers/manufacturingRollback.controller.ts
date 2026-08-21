import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrganizationId } from '../middleware/organizationContext';
import { ValidationError } from '../types';
import {
  reverseMaterialConsumptionSchema,
  reverseFinishedGoodsProductionSchema,
  cancelOrderWithReversalSchema,
  manufacturingOrderParamsSchema,
} from '../schemas/manufacturingRollback.schema';
import { manufacturingRollbackService } from '../services/manufacturingRollback.service';

export class ManufacturingRollbackController {
  reverseMaterialConsumption = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = reverseMaterialConsumptionSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const result = await manufacturingRollbackService.reverseMaterialConsumption(
      organizationId,
      paramsResult.data.id,
      bodyResult.data,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  reverseFinishedGoodsProduction = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = reverseFinishedGoodsProductionSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const result = await manufacturingRollbackService.reverseFinishedGoodsProduction(
      organizationId,
      paramsResult.data.id,
      bodyResult.data,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  cancelOrderWithReversal = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = cancelOrderWithReversalSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const cancelledOrder = await manufacturingRollbackService.cancelOrderWithReversal(
      organizationId,
      paramsResult.data.id,
      bodyResult.data.reason,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      data: cancelledOrder,
    });
  });

  getConsumptionReversals = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await manufacturingRollbackService.getConsumptionReversals(
      organizationId,
      paramsResult.data.id,
      { page, pageSize },
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  });

  getProductionReversals = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await manufacturingRollbackService.getProductionReversals(
      organizationId,
      paramsResult.data.id,
      { page, pageSize },
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  });
}

export const manufacturingRollbackController = new ManufacturingRollbackController();
