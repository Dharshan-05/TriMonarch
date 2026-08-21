import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrganizationId } from '../middleware/organizationContext';
import { ValidationError } from '../types';
import {
  produceFinishedGoodsSchema,
  manufacturingOrderParamsSchema,
  productionParamsSchema,
} from '../schemas/manufacturingProduction.schema';
import { manufacturingProductionService } from '../services/manufacturingProduction.service';

export class ManufacturingProductionController {
  produceFinishedGoods = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = produceFinishedGoodsSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const result = await manufacturingProductionService.produceFinishedGoods(
      organizationId,
      paramsResult.data.id,
      bodyResult.data,
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  getProductionHistory = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const history = await manufacturingProductionService.getProductionHistory(
      organizationId,
      paramsResult.data.id,
      { page, pageSize },
    );

    res.status(200).json({
      success: true,
      data: history.items,
      pagination: {
        page: history.page,
        pageSize: history.pageSize,
        total: history.total,
        totalPages: history.totalPages,
      },
    });
  });

  getProductionStatus = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const status = await manufacturingProductionService.getProductionStatus(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: status,
    });
  });

  getProduction = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = productionParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const record = await manufacturingProductionService.getProduction(
      organizationId,
      paramsResult.data.productionId,
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  });
}

export const manufacturingProductionController = new ManufacturingProductionController();
