-- UP
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'consumed', 'cancelled', 'expired')),
  reference_type VARCHAR(100),
  reference_id UUID,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_reservations_org_id ON stock_reservations(organization_id);
CREATE INDEX idx_stock_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_warehouse_id ON stock_reservations(warehouse_id);
CREATE INDEX idx_stock_reservations_org_product ON stock_reservations(organization_id, product_id);
CREATE INDEX idx_stock_reservations_org_warehouse ON stock_reservations(organization_id, warehouse_id);
CREATE INDEX idx_stock_reservations_org_status ON stock_reservations(organization_id, status);
CREATE INDEX idx_stock_reservations_org_prod_wh_status ON stock_reservations(organization_id, product_id, warehouse_id, status);
CREATE INDEX idx_stock_reservations_ref ON stock_reservations(organization_id, reference_type, reference_id);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at) WHERE status = 'active';

CREATE TRIGGER trg_stock_reservations_updated_at
BEFORE UPDATE ON stock_reservations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_stock_reservations_updated_at ON stock_reservations;
DROP TABLE IF EXISTS stock_reservations CASCADE;
