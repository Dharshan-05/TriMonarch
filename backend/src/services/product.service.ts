import { productRepository, ProductFilterParams } from '../repositories/product.repository';
import { CreateProductInput, UpdateProductInput, Product } from '../types/database';
import { NotFoundError, ValidationError } from '../types';
import { DuplicateKeyError } from '../db/errors';
import { PaginationParams, PaginatedResult } from '../repositories/base/pagination';
import { withTransaction } from '../db/transaction';
import { auditService } from '../audit/audit.service';
import { computeDiff } from '../audit/audit.utils';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

export class ProductService {
  async createProduct(data: CreateProductInput, userId?: string, requestId?: string): Promise<Product> {
    const parseResult = createProductSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid product payload', parseResult.error.format());
    }

    const validated = parseResult.data;
    const organizationId = validated.organization_id || data.organization_id;
    if (!organizationId) {
      throw new ValidationError('organization_id is required');
    }

    const normalizedSku = validated.sku.trim().toUpperCase();
    const normalizedName = validated.name.trim();

    return withTransaction(async (tx) => {
      const existingSku = await productRepository.findBySku(organizationId, normalizedSku, tx);
      if (existingSku) {
        throw new DuplicateKeyError(
          `Product with SKU '${normalizedSku}' already exists in this organization`,
          'uq_products_org_sku',
        );
      }

      const inputPayload: CreateProductInput = {
        ...validated,
        organization_id: organizationId,
        sku: normalizedSku,
        name: normalizedName,
      };

      const prod = await productRepository.create(inputPayload, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'CREATE',
          entity_type: 'PRODUCT',
          entity_id: prod.id,
          request_id: requestId,
          success: true,
          metadata: { sku: prod.sku, name: prod.name, category: prod.category, price: prod.price, cost: prod.cost },
        },
        tx,
      );

      return prod;
    });
  }

  async getProductById(organizationId: string, id: string): Promise<Product> {
    const prod = await productRepository.findById(organizationId, id);
    if (!prod) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }
    return prod;
  }

  async getProductBySku(organizationId: string, sku: string): Promise<Product> {
    const normalizedSku = sku.trim().toUpperCase();
    const prod = await productRepository.findBySku(organizationId, normalizedSku);
    if (!prod) {
      throw new NotFoundError(`Product with SKU ${sku} not found`);
    }
    return prod;
  }

  async listProducts(
    organizationId: string,
    params?: ProductFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    return productRepository.search(organizationId, params || {});
  }

  async searchProducts(
    organizationId: string,
    params?: ProductFilterParams & PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    return productRepository.search(organizationId, params || {});
  }

  async updateProduct(
    organizationId: string,
    id: string,
    data: UpdateProductInput,
    userId?: string,
    requestId?: string,
  ): Promise<Product> {
    const parseResult = updateProductSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError('Invalid product update payload', parseResult.error.format());
    }

    const validated = parseResult.data;

    return withTransaction(async (tx) => {
      const existing = await productRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      const updatePayload: UpdateProductInput = { ...validated };

      if (validated.sku) {
        const normalizedSku = validated.sku.trim().toUpperCase();
        if (normalizedSku !== existing.sku) {
          const existingSku = await productRepository.findBySku(organizationId, normalizedSku, tx);
          if (existingSku && existingSku.id !== id) {
            throw new DuplicateKeyError(
              `Product with SKU '${normalizedSku}' already exists in this organization`,
              'uq_products_org_sku',
            );
          }
          updatePayload.sku = normalizedSku;
        }
      }

      if (validated.name) {
        updatePayload.name = validated.name.trim();
      }

      const updated = (await productRepository.update(organizationId, id, updatePayload, tx))!;
      const diff = computeDiff(
        existing as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      );

      if (Object.keys(diff).length > 0) {
        await auditService.recordAuditEvent(
          {
            organization_id: organizationId,
            user_id: userId,
            action: 'UPDATE',
            entity_type: 'PRODUCT',
            entity_id: id,
            request_id: requestId,
            success: true,
            metadata: { changes: diff },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async deleteProduct(
    organizationId: string,
    id: string,
    userId?: string,
    requestId?: string,
  ): Promise<boolean> {
    return withTransaction(async (tx) => {
      const existing = await productRepository.findById(organizationId, id, tx);
      if (!existing) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      const deleted = await productRepository.delete(organizationId, id, tx);

      await auditService.recordAuditEvent(
        {
          organization_id: organizationId,
          user_id: userId,
          action: 'DELETE',
          entity_type: 'PRODUCT',
          entity_id: id,
          request_id: requestId,
          success: true,
          metadata: { deleted: { sku: existing.sku, name: existing.name } },
        },
        tx,
      );

      return deleted;
    });
  }
}

export const productService = new ProductService();
