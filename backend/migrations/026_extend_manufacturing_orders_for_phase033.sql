-- UP
-- Extend manufacturing_orders table for Phase 033
ALTER TABLE manufacturing_orders
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS mo_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Populate mo_number from order_number if null
UPDATE manufacturing_orders SET mo_number = order_number WHERE mo_number IS NULL;

-- Drop old status CHECK constraint if present and update to include 'confirmed'
ALTER TABLE manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_status_check;
ALTER TABLE manufacturing_orders
  ADD CONSTRAINT manufacturing_orders_status_check
  CHECK (status IN ('draft', 'confirmed', 'planned', 'released', 'in_progress', 'completed', 'cancelled'));

-- Add unique constraint for (organization_id, mo_number) if mo_number is present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_manufacturing_orders_org_mo_number'
  ) THEN
    ALTER TABLE manufacturing_orders
      ADD CONSTRAINT uq_manufacturing_orders_org_mo_number UNIQUE (organization_id, mo_number);
  END IF;
END $$;

-- Extend manufacturing_order_items table
ALTER TABLE manufacturing_order_items
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_org_warehouse ON manufacturing_orders(organization_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_org_mo_number ON manufacturing_orders(organization_id, mo_number);

-- DOWN
DROP INDEX IF EXISTS idx_manufacturing_orders_org_mo_number;
DROP INDEX IF EXISTS idx_manufacturing_orders_org_warehouse;

ALTER TABLE manufacturing_order_items
  DROP COLUMN IF EXISTS notes;

ALTER TABLE manufacturing_orders
  DROP CONSTRAINT IF EXISTS uq_manufacturing_orders_org_mo_number,
  DROP CONSTRAINT IF EXISTS manufacturing_orders_status_check,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS mo_number,
  DROP COLUMN IF EXISTS warehouse_id;

ALTER TABLE manufacturing_orders
  ADD CONSTRAINT manufacturing_orders_status_check
  CHECK (status IN ('draft', 'planned', 'released', 'in_progress', 'completed', 'cancelled'));
