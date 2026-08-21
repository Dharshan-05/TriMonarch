import { Request, Response } from 'express';
import { accountsPayableService } from '../services/accountsPayable.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import { supplierInvoicesBySupplierParamsSchema } from '../schemas/supplierInvoice.schema';
import { ValidationError } from '../types';

export class AccountsPayableController {
  getSupplierPayables = asyncHandler(async (req: Request, res: Response) => {
    const paramsResult = supplierInvoicesBySupplierParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const organizationId = getOrganizationId(req);
    const balance = await accountsPayableService.getSupplierOutstandingBalance(
      organizationId,
      paramsResult.data.supplierId,
    );

    res.status(200).json({
      success: true,
      data: balance,
    });
  });

  getAPSummary = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = getOrganizationId(req);
    const summary = await accountsPayableService.getAccountsPayableSummary(organizationId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  getAPAging = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = getOrganizationId(req);
    const aging = await accountsPayableService.getAccountsPayableAging(organizationId);

    res.status(200).json({
      success: true,
      data: aging,
    });
  });
}

export const accountsPayableController = new AccountsPayableController();
