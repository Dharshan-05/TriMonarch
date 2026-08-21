import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class ProductController {
  private getPolicyContext(req: Request): PolicyContext {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    const organizationId = getOrganizationId(req);
    return {
      userId: req.auth.userId,
      organizationId,
      roles: req.auth.roles || ['EMPLOYEE'],
    };
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const orgId = context.organizationId;

    policyEngine.assertCan(context, 'CREATE', 'PRODUCT');

    const prod = await productService.createProduct({ ...req.body, organization_id: orgId }, context.userId, req.id);
    const response: ApiResponse<typeof prod> = {
      success: true,
      data: prod,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const prod = await productService.getProductById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'PRODUCT', prod);

    const response: ApiResponse<typeof prod> = {
      success: true,
      data: prod,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'PRODUCT');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const query = (req.query.query as string | undefined) || (req.query.search as string | undefined);
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await productService.searchProducts(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      category,
      status,
    });

    const response: ApiPaginatedResponse<(typeof result.items)[0]> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        requestId: req.id,
      },
    };
    res.status(200).json(response);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await productService.getProductById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PRODUCT', existing);

    const updated = await productService.updateProduct(context.organizationId, req.params.id!, req.body, context.userId, req.id);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await productService.getProductById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PRODUCT', existing);

    const updated = await productService.updateProductStatus(
      context.organizationId,
      req.params.id!,
      req.body.status,
      context.userId,
      req.id,
    );
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await productService.getProductById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'PRODUCT', existing);

    await productService.deleteProduct(context.organizationId, req.params.id!, context.userId, req.id);
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Product successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const productController = new ProductController();
