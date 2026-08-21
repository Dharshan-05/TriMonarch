import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import {
  SupplierPayment,
  CreateSupplierPaymentInput,
  PaymentMethod,
} from '../types/database';
import { BaseRepository } from './base/base.repository';
import { BaseFilterParams, PaginatedResult } from './base';

export interface SupplierPaymentFilterParams extends BaseFilterParams {
  supplier_id?: string;
  supplier_invoice_id?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
}

export class SupplierPaymentRepository extends BaseRepository<
  SupplierPayment,
  CreateSupplierPaymentInput,
  Record<string, unknown>,
  SupplierPaymentFilterParams
> {
  protected readonly tableName = 'supplier_payments';
  protected readonly allowedSortFields = [
    'payment_number',
    'payment_date',
    'amount',
    'payment_method',
    'created_at',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  async create(data: CreateSupplierPaymentInput, client?: PoolClient): Promise<SupplierPayment> {
    const rows = await query<SupplierPayment>(
      `INSERT INTO supplier_payments (
         organization_id, supplier_invoice_id, supplier_id, payment_number,
         payment_date, amount, payment_method, reference_number, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        data.organization_id,
        data.supplier_invoice_id,
        data.supplier_id,
        data.payment_number,
        data.payment_date || new Date(),
        String(data.amount),
        data.payment_method,
        data.reference_number || null,
        data.notes || null,
        data.created_by || null,
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<SupplierPayment | null> {
    return queryOne<SupplierPayment>(
      'SELECT * FROM supplier_payments WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async lockByIdForUpdate(
    organizationId: string,
    id: string,
    client?: PoolClient,
  ): Promise<SupplierPayment | null> {
    return queryOne<SupplierPayment>(
      'SELECT * FROM supplier_payments WHERE id = $1 AND organization_id = $2 FOR UPDATE;',
      [id, organizationId],
      client,
    );
  }

  async findByPaymentNumber(
    organizationId: string,
    paymentNumber: string,
    client?: PoolClient,
  ): Promise<SupplierPayment | null> {
    return queryOne<SupplierPayment>(
      'SELECT * FROM supplier_payments WHERE payment_number = $1 AND organization_id = $2;',
      [paymentNumber, organizationId],
      client,
    );
  }

  async findByInvoice(
    organizationId: string,
    supplierInvoiceId: string,
    client?: PoolClient,
  ): Promise<SupplierPayment[]> {
    return query<SupplierPayment>(
      'SELECT * FROM supplier_payments WHERE supplier_invoice_id = $1 AND organization_id = $2 ORDER BY payment_date DESC, created_at DESC;',
      [supplierInvoiceId, organizationId],
      client,
    );
  }

  async findManyBySupplier(
    organizationId: string,
    supplierId: string,
    client?: PoolClient,
  ): Promise<SupplierPayment[]> {
    return query<SupplierPayment>(
      'SELECT * FROM supplier_payments WHERE supplier_id = $1 AND organization_id = $2 ORDER BY payment_date DESC, created_at DESC;',
      [supplierId, organizationId],
      client,
    );
  }

  async update(
    _organizationId: string,
    _id: string,
    _data: Record<string, unknown>,
    _client?: PoolClient,
  ): Promise<SupplierPayment | null> {
    throw new Error('Supplier payments are append-only and cannot be updated');
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: SupplierPaymentFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.supplier_id) {
      conditions.push(`supplier_id = $${idx++}`);
      values.push(params.supplier_id);
    }

    if (params?.supplier_invoice_id) {
      conditions.push(`supplier_invoice_id = $${idx++}`);
      values.push(params.supplier_invoice_id);
    }

    if (params?.payment_method) {
      conditions.push(`payment_method = $${idx++}`);
      values.push(params.payment_method);
    }

    if (params?.date_from) {
      conditions.push(`payment_date >= $${idx++}`);
      values.push(params.date_from);
    }

    if (params?.date_to) {
      conditions.push(`payment_date <= $${idx++}`);
      values.push(params.date_to);
    }

    return { conditions, values };
  }

  async listPayments(
    organizationId: string,
    params?: SupplierPaymentFilterParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<SupplierPayment>> {
    return this.listByOrganization(organizationId, params, client);
  }
}

export const supplierPaymentRepository = new SupplierPaymentRepository();
