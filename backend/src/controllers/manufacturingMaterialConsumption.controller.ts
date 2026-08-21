import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrganizationId } from '../middleware/organizationContext';
import { ValidationError } from '../types';
import {
  consumeMaterialsSchema,
  manufacturingOrderParamsSchema,
  consumptionParamsSchema,
} from '../schemas/manufacturingMaterialConsumption.schema';
import { manufacturingMaterialConsumptionService } from '../services/manufacturingMaterialConsumption.service';

export class ManufacturingMaterialConsumptionController {
  consumeMaterials = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = consumeMaterialsSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const result = await manufacturingMaterialConsumptionService.consumeMaterials(
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

  getConsumptionHistory = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const history = await manufacturingMaterialConsumptionService.getConsumptionHistory(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  });

  getMaterialConsumptionStatus = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = manufacturingOrderParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const status = await manufacturingMaterialConsumptionService.getMaterialConsumptionStatus(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: status,
    });
  });

  getConsumption = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = consumptionParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const record = await manufacturingMaterialConsumptionService.getConsumption(
      organizationId,
      paramsResult.data.consumptionId,
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  });
}

export const manufacturingMaterialConsumptionController =
  new ManufacturingMaterialConsumptionController();
