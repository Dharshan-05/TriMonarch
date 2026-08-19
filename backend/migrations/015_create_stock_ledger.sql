-- UP
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT')),
  quantity NUMERIC(19, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  reference_type VARCHAR(100),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_ledger_organization_id ON stock_ledger(organization_id);
CREATE INDEX idx_stock_ledger_org_product ON stock_ledger(organization_id, product_id);
CREATE INDEX idx_stock_ledger_org_warehouse ON stock_ledger(organization_id, warehouse_id);
CREATE INDEX idx_stock_ledger_org_prod_wh ON stock_ledger(organization_id, product_id, warehouse_id);
CREATE INDEX idx_stock_ledger_org_created ON stock_ledger(organization_id, created_at);
CREATE INDEX idx_stock_ledger_org_movement ON stock_ledger(organization_id, movement_type);
CREATE INDEX idx_stock_ledger_org_reference ON stock_ledger(organization_id, reference_type, reference_id);

-- DOWN
DROP TABLE IF EXISTS stock_ledger CASCADE;
