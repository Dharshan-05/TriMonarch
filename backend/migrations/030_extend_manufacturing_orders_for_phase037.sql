-- UP
ALTER TABLE manufacturing_orders
  ADD COLUMN IF NOT EXISTS produced_quantity NUMERIC(19, 4) NOT NULL DEFAULT 0.0000 CHECK (produced_quantity >= 0);

UPDATE manufacturing_orders
  SET produced_quantity = completed_quantity
  WHERE produced_quantity = 0 AND completed_quantity > 0;

-- DOWN
ALTER TABLE manufacturing_orders
  DROP COLUMN IF EXISTS produced_quantity;
