-- UP
CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  bom_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1 CHECK (version > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_boms_org_code UNIQUE (organization_id, bom_code)
);

CREATE INDEX idx_boms_organization_id ON boms(organization_id);
CREATE INDEX idx_boms_org_product ON boms(organization_id, product_id);
CREATE INDEX idx_boms_org_code ON boms(organization_id, bom_code);
CREATE INDEX idx_boms_org_status ON boms(organization_id, status);

CREATE TRIGGER trg_boms_updated_at
BEFORE UPDATE ON boms
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(19, 4) NOT NULL DEFAULT 1.0000 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  sequence INT NOT NULL DEFAULT 1 CHECK (sequence > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_bom_items_bom_seq UNIQUE (bom_id, sequence)
);

CREATE INDEX idx_bom_items_organization_id ON bom_items(organization_id);
CREATE INDEX idx_bom_items_org_bom ON bom_items(organization_id, bom_id);
CREATE INDEX idx_bom_items_org_component ON bom_items(organization_id, component_product_id);

CREATE TRIGGER trg_bom_items_updated_at
BEFORE UPDATE ON bom_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_bom_items_updated_at ON bom_items;
DROP TABLE IF EXISTS bom_items CASCADE;
DROP TRIGGER IF EXISTS trg_boms_updated_at ON boms;
DROP TABLE IF EXISTS boms CASCADE;
