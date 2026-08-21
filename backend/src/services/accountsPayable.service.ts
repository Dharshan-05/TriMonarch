import { supplierInvoiceRepository } from '../repositories/supplierInvoice.repository';
import { supplierRepository } from '../repositories/supplier.repository';
import { SupplierNotFoundError, SupplierInvoiceNotFoundError } from '../types';

export class AccountsPayableService {
  /**
   * Retrieves outstanding Accounts Payable balance for a specific supplier.
   */
  async getSupplierOutstandingBalance(
    organizationId: string,
    supplierId: string,
  ): Promise<{ supplier_id: string; outstanding_balance: string }> {
    const supplier = await supplierRepository.findById(organizationId, supplierId);
    if (!supplier) {
      throw new SupplierNotFoundError(`Supplier with ID ${supplierId} not found`);
    }

    const outstanding = await supplierInvoiceRepository.calculateOutstanding(
      organizationId,
      supplierId,
    );

    return {
      supplier_id: supplierId,
      outstanding_balance: outstanding,
    };
  }

  /**
   * Retrieves outstanding balance for a specific invoice.
   */
  async getInvoiceOutstandingBalance(
    organizationId: string,
    invoiceId: string,
  ): Promise<{ invoice_id: string; amount_due: string; status: string }> {
    const invoice = await supplierInvoiceRepository.findById(organizationId, invoiceId);
    if (!invoice) {
      throw new SupplierInvoiceNotFoundError(`Supplier invoice with ID ${invoiceId} not found`);
    }

    return {
      invoice_id: invoiceId,
      amount_due: String(invoice.amount_due),
      status: invoice.status,
    };
  }

  /**
   * Retrieves organization-wide Accounts Payable summary.
   */
  async getAccountsPayableSummary(organizationId: string) {
    return supplierInvoiceRepository.getAPSummary(organizationId);
  }

  /**
   * Retrieves Accounts Payable aging report.
   */
  async getAccountsPayableAging(organizationId: string) {
    return supplierInvoiceRepository.getAPAging(organizationId);
  }
}

export const accountsPayableService = new AccountsPayableService();
