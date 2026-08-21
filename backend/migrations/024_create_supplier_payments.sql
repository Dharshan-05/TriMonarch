-- Migration: 024_create_supplier_payments.sql
-- Description: Create supplier_payments table for recording Accounts Payable payments.

CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  supplier_invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  payment_number VARCHAR(100) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(20, 4) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
  reference_number VARCHAR(150),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_supplier_payments_org_number UNIQUE (organization_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_organization_id ON supplier_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_org_invoice ON supplier_payments(organization_id, supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_org_supplier ON supplier_payments(organization_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_org_date ON supplier_payments(organization_id, payment_date);

CREATE TRIGGER trg_supplier_payments_updated_at
BEFORE UPDATE ON supplier_payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
