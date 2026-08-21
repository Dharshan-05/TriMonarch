-- Migration: 023_create_supplier_invoice_items.sql
-- Description: Create supplier_invoice_items table with numeric precision and foreign key constraints.

CREATE TABLE IF NOT EXISTS supplier_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
  purchase_receipt_item_id UUID REFERENCES purchase_receipt_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity NUMERIC(20, 4) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(20, 4) NOT NULL CHECK (unit_cost >= 0),
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
  tax_rate NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_amount >= 0),
  line_total NUMERIC(20, 4) NOT NULL DEFAULT 0.0000 CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_organization_id ON supplier_invoice_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_org_invoice ON supplier_invoice_items(organization_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_org_po_item ON supplier_invoice_items(organization_id, purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_org_receipt_item ON supplier_invoice_items(organization_id, purchase_receipt_item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_org_product ON supplier_invoice_items(organization_id, product_id);

CREATE TRIGGER trg_supplier_invoice_items_updated_at
BEFORE UPDATE ON supplier_invoice_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
