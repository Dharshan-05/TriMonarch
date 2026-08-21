import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getOrganizationId } from '../middleware/organizationContext';
import { ValidationError } from '../types';
import { componentAvailabilityParamsSchema } from '../schemas/componentAvailability.schema';
import { componentAvailabilityService } from '../services/componentAvailability.service';

export class ComponentAvailabilityController {
  getComponentAvailability = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = componentAvailabilityParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const availability = await componentAvailabilityService.checkManufacturingOrderAvailability(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: availability,
    });
  });

  getReadiness = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = componentAvailabilityParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const readiness = await componentAvailabilityService.getReadiness(
      organizationId,
      paramsResult.data.id,
    );

    res.status(200).json({
      success: true,
      data: readiness,
    });
  });
}

export const componentAvailabilityController = new ComponentAvailabilityController();
