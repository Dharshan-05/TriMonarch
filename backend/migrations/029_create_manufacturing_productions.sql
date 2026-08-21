-- UP
CREATE TABLE IF NOT EXISTS manufacturing_productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  production_number VARCHAR(100) NOT NULL,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  produced_by UUID REFERENCES users(id) ON DELETE SET NULL,
  produced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_manufacturing_productions_org_prod_num UNIQUE (organization_id, production_number)
);

CREATE INDEX idx_mo_productions_org ON manufacturing_productions(organization_id);
CREATE INDEX idx_mo_productions_mo ON manufacturing_productions(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_productions_product ON manufacturing_productions(organization_id, product_id);
CREATE INDEX idx_mo_productions_wh ON manufacturing_productions(organization_id, warehouse_id);
CREATE INDEX idx_mo_productions_produced_at ON manufacturing_productions(organization_id, produced_at);

CREATE TRIGGER trg_manufacturing_productions_updated_at
BEFORE UPDATE ON manufacturing_productions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_manufacturing_productions_updated_at ON manufacturing_productions;
DROP INDEX IF EXISTS idx_mo_productions_produced_at;
DROP INDEX IF EXISTS idx_mo_productions_wh;
DROP INDEX IF EXISTS idx_mo_productions_product;
DROP INDEX IF EXISTS idx_mo_productions_mo;
DROP INDEX IF EXISTS idx_mo_productions_org;
DROP TABLE IF EXISTS manufacturing_productions CASCADE;
