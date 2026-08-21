import { Request, Response } from 'express';
import { salesDeliveryService } from '../services/salesDelivery.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createSalesDeliverySchema,
  addDeliveryItemSchema,
  listDeliveriesQuerySchema,
  deliveryParamsSchema,
  deliveryItemParamsSchema,
  salesOrderDeliveryParamsSchema,
} from '../schemas/salesDelivery.schema';
import { ValidationError } from '../types';

export class SalesDeliveryController {
  createDelivery = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = createSalesDeliverySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const delivery = await salesDeliveryService.createDelivery(
      {
        ...parseResult.data,
        organization_id: organizationId,
      },
      userId,
      requestId,
    );

    res.status(201).json({
      success: true,
      data: delivery,
    });
  });

  getDelivery = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await salesDeliveryService.getDelivery(organizationId, paramsResult.data.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  listDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const queryResult = listDeliveriesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const result = await salesDeliveryService.listDeliveries(organizationId, queryResult.data);

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

  addDeliveryItem = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const bodyResult = addDeliveryItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    const item = await salesDeliveryService.addDeliveryItem(
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

  removeDeliveryItem = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryItemParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const userId = req.auth?.userId;
    const requestId = req.id;

    await salesDeliveryService.removeDeliveryItem(
      organizationId,
      paramsResult.data.id,
      paramsResult.data.itemId,
      userId,
      requestId,
    );

    res.status(200).json({
      success: true,
      message: 'Delivery item removed successfully',
    });
  });

  confirmDelivery = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.confirmDelivery(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  startPicking = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.startPicking(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  markPacked = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.markPacked(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  shipDelivery = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.shipDelivery(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  deliverDelivery = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.deliverDelivery(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  cancelDelivery = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = deliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const delivery = await salesDeliveryService.cancelDelivery(
      organizationId,
      paramsResult.data.id,
      req.auth?.userId,
      req.id,
    );

    res.status(200).json({ success: true, data: delivery });
  });

  getSalesOrderDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = salesOrderDeliveryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const deliveries = await salesDeliveryService.getSalesOrderDeliveries(
      organizationId,
      paramsResult.data.salesOrderId,
    );

    res.status(200).json({ success: true, data: deliveries });
  });
}

export const salesDeliveryController = new SalesDeliveryController();
