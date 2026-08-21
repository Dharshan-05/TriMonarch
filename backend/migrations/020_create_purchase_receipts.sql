-- Migration: 020_create_purchase_receipts.sql
-- Description: Create purchase_receipts table with status check constraint, indexes, and foreign keys.

CREATE TABLE IF NOT EXISTS purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  receipt_number VARCHAR(100) NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'completed', 'cancelled')),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_purchase_receipts_org_number UNIQUE (organization_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_organization_id ON purchase_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_po ON purchase_receipts(organization_id, purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_warehouse ON purchase_receipts(organization_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_status ON purchase_receipts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_number ON purchase_receipts(organization_id, receipt_number);

CREATE TRIGGER trg_purchase_receipts_updated_at
BEFORE UPDATE ON purchase_receipts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
