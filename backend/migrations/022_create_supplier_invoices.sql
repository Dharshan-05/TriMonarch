-- Migration: 022_create_supplier_invoices.sql
-- Description: Create supplier_invoices table with status check constraint, indexes, and unique constraints.

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  purchase_receipt_id UUID REFERENCES purchase_receipts(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(100) NOT NULL,
  supplier_invoice_number VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'partially_paid', 'paid', 'cancelled')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (subtotal >= 0),
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_amount >= 0),
  total_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (total_amount >= 0),
  amount_paid NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (amount_paid >= 0),
  amount_due NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (amount_due >= 0),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_supplier_invoices_org_number UNIQUE (organization_id, invoice_number),
  CONSTRAINT uq_supplier_invoices_org_supp_num UNIQUE (organization_id, supplier_id, supplier_invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_organization_id ON supplier_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_supplier ON supplier_invoices(organization_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_po ON supplier_invoices(organization_id, purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_receipt ON supplier_invoices(organization_id, purchase_receipt_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_status ON supplier_invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_date ON supplier_invoices(organization_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_due ON supplier_invoices(organization_id, due_date);

CREATE TRIGGER trg_supplier_invoices_updated_at
BEFORE UPDATE ON supplier_invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
