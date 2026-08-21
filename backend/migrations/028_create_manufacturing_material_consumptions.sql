-- UP
CREATE TABLE IF NOT EXISTS manufacturing_material_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  manufacturing_order_item_id UUID NOT NULL REFERENCES manufacturing_order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity NUMERIC(19, 4) NOT NULL CHECK (quantity > 0),
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_mo_material_consumption_ref UNIQUE (organization_id, reference_number)
);

CREATE INDEX idx_mo_consumptions_org ON manufacturing_material_consumptions(organization_id);
CREATE INDEX idx_mo_consumptions_mo ON manufacturing_material_consumptions(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_consumptions_item ON manufacturing_material_consumptions(organization_id, manufacturing_order_item_id);
CREATE INDEX idx_mo_consumptions_product ON manufacturing_material_consumptions(organization_id, product_id);
CREATE INDEX idx_mo_consumptions_wh ON manufacturing_material_consumptions(organization_id, warehouse_id);
CREATE INDEX idx_mo_consumptions_consumed_at ON manufacturing_material_consumptions(organization_id, consumed_at);

-- DOWN
DROP INDEX IF EXISTS idx_mo_consumptions_consumed_at;
DROP INDEX IF EXISTS idx_mo_consumptions_wh;
DROP INDEX IF EXISTS idx_mo_consumptions_product;
DROP INDEX IF EXISTS idx_mo_consumptions_item;
DROP INDEX IF EXISTS idx_mo_consumptions_mo;
DROP INDEX IF EXISTS idx_mo_consumptions_org;
DROP TABLE IF EXISTS manufacturing_material_consumptions CASCADE;
