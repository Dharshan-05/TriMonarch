-- UP
CREATE TABLE IF NOT EXISTS manufacturing_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  request_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_mo_status_history_distinct CHECK (from_status <> to_status)
);

CREATE INDEX idx_mo_status_history_org ON manufacturing_order_status_history(organization_id);
CREATE INDEX idx_mo_status_history_mo ON manufacturing_order_status_history(organization_id, manufacturing_order_id);
CREATE INDEX idx_mo_status_history_created_at ON manufacturing_order_status_history(organization_id, created_at);

-- DOWN
DROP INDEX IF EXISTS idx_mo_status_history_created_at;
DROP INDEX IF EXISTS idx_mo_status_history_mo;
DROP INDEX IF EXISTS idx_mo_status_history_org;
DROP TABLE IF EXISTS manufacturing_order_status_history CASCADE;
