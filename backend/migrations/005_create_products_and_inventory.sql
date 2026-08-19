-- UP
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_products_org_sku UNIQUE (organization_id, sku)
);

CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  location TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_warehouses_org_code UNIQUE (organization_id, code)
);

CREATE INDEX idx_warehouses_organization_id ON warehouses(organization_id);

CREATE TRIGGER trg_warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_inventory_product_warehouse UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_inventory_organization_id ON inventory(organization_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);

CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TRIGGER IF EXISTS trg_warehouses_updated_at ON warehouses;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
DROP TABLE IF EXISTS products CASCADE;
