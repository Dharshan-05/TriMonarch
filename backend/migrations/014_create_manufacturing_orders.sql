-- UP
CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_number VARCHAR(100) NOT NULL,
  planned_quantity NUMERIC(19, 4) NOT NULL DEFAULT 1.0000 CHECK (planned_quantity >= 0),
  completed_quantity NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (completed_quantity >= 0),
  scheduled_start_date TIMESTAMPTZ,
  scheduled_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'released', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_manufacturing_orders_org_number UNIQUE (organization_id, order_number)
);

CREATE INDEX idx_manufacturing_orders_organization_id ON manufacturing_orders(organization_id);
CREATE INDEX idx_manufacturing_orders_org_number ON manufacturing_orders(organization_id, order_number);
CREATE INDEX idx_manufacturing_orders_org_bom ON manufacturing_orders(organization_id, bom_id);
CREATE INDEX idx_manufacturing_orders_org_product ON manufacturing_orders(organization_id, product_id);
CREATE INDEX idx_manufacturing_orders_org_status ON manufacturing_orders(organization_id, status);
CREATE INDEX idx_manufacturing_orders_org_scheduled_start ON manufacturing_orders(organization_id, scheduled_start_date);

CREATE TRIGGER trg_manufacturing_orders_updated_at
BEFORE UPDATE ON manufacturing_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS manufacturing_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  bom_item_id UUID REFERENCES bom_items(id) ON DELETE SET NULL,
  required_quantity NUMERIC(19, 4) NOT NULL DEFAULT 1.0000 CHECK (required_quantity >= 0),
  consumed_quantity NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (consumed_quantity >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  sequence INT NOT NULL DEFAULT 1 CHECK (sequence > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_manufacturing_order_items_order_seq UNIQUE (manufacturing_order_id, sequence)
);

CREATE INDEX idx_mo_items_organization_id ON manufacturing_order_items(organization_id);
CREATE INDEX idx_mo_items_org_order ON manufacturing_order_items(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_items_org_component ON manufacturing_order_items(organization_id, component_product_id);
CREATE INDEX idx_mo_items_org_bom_item ON manufacturing_order_items(organization_id, bom_item_id);

CREATE TRIGGER trg_manufacturing_order_items_updated_at
BEFORE UPDATE ON manufacturing_order_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_manufacturing_order_items_updated_at ON manufacturing_order_items;
DROP TABLE IF EXISTS manufacturing_order_items CASCADE;
DROP TRIGGER IF EXISTS trg_manufacturing_orders_updated_at ON manufacturing_orders;
DROP TABLE IF EXISTS manufacturing_orders CASCADE;
