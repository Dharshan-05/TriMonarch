-- UP
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_number VARCHAR(100) NOT NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'processing', 'received', 'completed', 'cancelled')),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (subtotal >= 0),
  tax_amount NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
  total_amount NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_purchase_orders_org_number UNIQUE (organization_id, order_number)
);

CREATE INDEX idx_purchase_orders_organization_id ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_org_supplier ON purchase_orders(organization_id, supplier_id);
CREATE INDEX idx_purchase_orders_org_number ON purchase_orders(organization_id, order_number);
CREATE INDEX idx_purchase_orders_org_status ON purchase_orders(organization_id, status);
CREATE INDEX idx_purchase_orders_org_date ON purchase_orders(organization_id, order_date);
CREATE INDEX idx_purchase_orders_org_expected ON purchase_orders(organization_id, expected_delivery_date);

CREATE TRIGGER trg_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(19, 4) NOT NULL DEFAULT 1.0000 CHECK (quantity >= 0),
  unit_cost NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (unit_cost >= 0),
  discount_amount NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
  tax_rate NUMERIC(19, 6) NOT NULL DEFAULT 0.000000 CHECK (tax_rate >= 0),
  tax_amount NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_amount >= 0),
  line_total NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (line_total >= 0),
  sequence INT NOT NULL DEFAULT 1 CHECK (sequence > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_purchase_order_items_order_seq UNIQUE (purchase_order_id, sequence)
);

CREATE INDEX idx_purchase_order_items_organization_id ON purchase_order_items(organization_id);
CREATE INDEX idx_purchase_order_items_org_order ON purchase_order_items(organization_id, purchase_order_id);
CREATE INDEX idx_purchase_order_items_org_product ON purchase_order_items(organization_id, product_id);

CREATE TRIGGER trg_purchase_order_items_updated_at
BEFORE UPDATE ON purchase_order_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_purchase_order_items_updated_at ON purchase_order_items;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TRIGGER IF EXISTS trg_purchase_orders_updated_at ON purchase_orders;
DROP TABLE IF EXISTS purchase_orders CASCADE;
