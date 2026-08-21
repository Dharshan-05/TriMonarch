-- UP
CREATE TABLE IF NOT EXISTS manufacturing_consumption_reversals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  manufacturing_material_consumption_id UUID REFERENCES manufacturing_material_consumptions(id) ON DELETE SET NULL,
  manufacturing_order_item_id UUID NOT NULL REFERENCES manufacturing_order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  reversal_number VARCHAR(100) NOT NULL,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  reversed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reversed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_mo_consumption_reversals_org_ref UNIQUE (organization_id, reversal_number)
);

CREATE INDEX idx_mo_con_rev_org ON manufacturing_consumption_reversals(organization_id);
CREATE INDEX idx_mo_con_rev_mo ON manufacturing_consumption_reversals(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_con_rev_item ON manufacturing_consumption_reversals(organization_id, manufacturing_order_item_id);
CREATE INDEX idx_mo_con_rev_product ON manufacturing_consumption_reversals(organization_id, product_id);

CREATE TABLE IF NOT EXISTS manufacturing_production_reversals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  manufacturing_production_id UUID REFERENCES manufacturing_productions(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  reversal_number VARCHAR(100) NOT NULL,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  reversed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reversed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_mo_prod_reversals_org_ref UNIQUE (organization_id, reversal_number)
);

CREATE INDEX idx_mo_prod_rev_org ON manufacturing_production_reversals(organization_id);
CREATE INDEX idx_mo_prod_rev_mo ON manufacturing_production_reversals(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_prod_rev_product ON manufacturing_production_reversals(organization_id, product_id);

-- DOWN
DROP INDEX IF EXISTS idx_mo_prod_rev_product;
DROP INDEX IF EXISTS idx_mo_prod_rev_mo;
DROP INDEX IF EXISTS idx_mo_prod_rev_org;
DROP TABLE IF EXISTS manufacturing_production_reversals CASCADE;

DROP INDEX IF EXISTS idx_mo_con_rev_product;
DROP INDEX IF EXISTS idx_mo_con_rev_item;
DROP INDEX IF EXISTS idx_mo_con_rev_mo;
DROP INDEX IF EXISTS idx_mo_con_rev_org;
DROP TABLE IF EXISTS manufacturing_consumption_reversals CASCADE;
