-- Migration: 021_create_purchase_receipt_items.sql
-- Description: Create purchase_receipt_items table with quantity/cost constraints, indexes, and foreign keys.

CREATE TABLE IF NOT EXISTS purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (unit_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_organization_id ON purchase_receipt_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_org_receipt ON purchase_receipt_items(organization_id, receipt_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_org_po_item ON purchase_receipt_items(organization_id, purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_org_product ON purchase_receipt_items(organization_id, product_id);

CREATE TRIGGER trg_purchase_receipt_items_updated_at
BEFORE UPDATE ON purchase_receipt_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
