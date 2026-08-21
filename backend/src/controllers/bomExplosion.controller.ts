import { Request, Response } from 'express';
import { bomExplosionService } from '../services/bomExplosion.service';
import { bomRepository } from '../repositories/bom.repository';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import {
  bomExplosionSchema,
  bomExplosionParamsSchema,
  bomExplosionQuerySchema,
} from '../schemas/bomExplosion.schema';
import { ValidationError, ActiveBomNotFoundError } from '../types';

export class BomExplosionController {
  explodeBom = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = bomExplosionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);

    const result = await bomExplosionService.explodeBom({
      ...parseResult.data,
      organization_id: organizationId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getBomExplosion = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = bomExplosionParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const queryResult = bomExplosionQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);

    const bom = await bomRepository.findById(organizationId, paramsResult.data.id);
    if (!bom) {
      throw new ActiveBomNotFoundError(`BOM with ID ${paramsResult.data.id} not found`);
    }

    const result = await bomExplosionService.explodeBom({
      organization_id: organizationId,
      product_id: bom.product_id,
      bom_id: bom.id,
      quantity: queryResult.data.quantity,
      max_depth: queryResult.data.max_depth,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const bomExplosionController = new BomExplosionController();
