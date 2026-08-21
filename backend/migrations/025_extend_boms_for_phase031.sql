-- UP
-- Extend boms table for Phase 031 BOM Management Engine
ALTER TABLE boms DROP CONSTRAINT IF EXISTS boms_status_check;
ALTER TABLE boms ADD CONSTRAINT boms_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'));

ALTER TABLE boms ADD COLUMN IF NOT EXISTS bom_number VARCHAR(100);
ALTER TABLE boms ADD COLUMN IF NOT EXISTS revision VARCHAR(50) DEFAULT '1';
ALTER TABLE boms ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ;
ALTER TABLE boms ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;
ALTER TABLE boms ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE boms ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE boms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE boms ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill bom_number from bom_code for existing records
UPDATE boms SET bom_number = bom_code WHERE bom_number IS NULL;

-- Unique constraints for boms
ALTER TABLE boms DROP CONSTRAINT IF EXISTS uq_boms_org_bom_number;
ALTER TABLE boms ADD CONSTRAINT uq_boms_org_bom_number UNIQUE (organization_id, bom_number);

ALTER TABLE boms DROP CONSTRAINT IF EXISTS uq_boms_org_product_revision;
ALTER TABLE boms ADD CONSTRAINT uq_boms_org_product_revision UNIQUE (organization_id, product_id, revision);

CREATE UNIQUE INDEX IF NOT EXISTS idx_boms_org_product_default ON boms(organization_id, product_id) WHERE is_default = true;

-- BOM Component alterations
ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_quantity_check;
ALTER TABLE bom_items ADD CONSTRAINT bom_items_quantity_check CHECK (quantity > 0);

ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_sequence_check;
ALTER TABLE bom_items ADD CONSTRAINT bom_items_sequence_check CHECK (sequence >= 0);

ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS scrap_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_scrap_percentage_check;
ALTER TABLE bom_items ADD CONSTRAINT bom_items_scrap_percentage_check CHECK (scrap_percentage >= 0 AND scrap_percentage <= 100);

ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS uq_bom_items_org_bom_component;
ALTER TABLE bom_items ADD CONSTRAINT uq_bom_items_org_bom_component UNIQUE (organization_id, bom_id, component_product_id);

CREATE INDEX IF NOT EXISTS idx_boms_org_bom_number ON boms(organization_id, bom_number);
CREATE INDEX IF NOT EXISTS idx_boms_org_product_revision ON boms(organization_id, product_id, revision);

-- DOWN
DROP INDEX IF EXISTS idx_boms_org_product_revision;
DROP INDEX IF EXISTS idx_boms_org_bom_number;
ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS uq_bom_items_org_bom_component;
ALTER TABLE bom_items DROP COLUMN IF EXISTS notes;
ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_scrap_percentage_check;
ALTER TABLE bom_items DROP COLUMN IF EXISTS scrap_percentage;
DROP INDEX IF EXISTS idx_boms_org_product_default;
ALTER TABLE boms DROP CONSTRAINT IF EXISTS uq_boms_org_product_revision;
ALTER TABLE boms DROP CONSTRAINT IF EXISTS uq_boms_org_bom_number;
ALTER TABLE boms DROP COLUMN IF EXISTS updated_by;
ALTER TABLE boms DROP COLUMN IF EXISTS created_by;
ALTER TABLE boms DROP COLUMN IF EXISTS notes;
ALTER TABLE boms DROP COLUMN IF EXISTS is_default;
ALTER TABLE boms DROP COLUMN IF EXISTS effective_to;
ALTER TABLE boms DROP COLUMN IF EXISTS effective_from;
ALTER TABLE boms DROP COLUMN IF EXISTS revision;
ALTER TABLE boms DROP COLUMN IF EXISTS bom_number;
