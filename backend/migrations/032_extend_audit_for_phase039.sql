-- UP
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'CATEGORY_A',
  ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS before_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS after_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_cat ON audit_logs(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_act ON audit_logs(organization_id, action);

-- Database-level Immutability Protection Triggers (Defense-in-depth)
CREATE OR REPLACE FUNCTION prevent_audit_logs_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_audit_logs_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_update ON audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_logs_update();

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_delete ON audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_logs_delete();

-- DOWN
DROP TRIGGER IF EXISTS trg_prevent_audit_logs_delete ON audit_logs;
DROP TRIGGER IF EXISTS trg_prevent_audit_logs_update ON audit_logs;
DROP FUNCTION IF EXISTS prevent_audit_logs_delete();
DROP FUNCTION IF EXISTS prevent_audit_logs_update();

DROP INDEX IF EXISTS idx_audit_logs_org_act;
DROP INDEX IF EXISTS idx_audit_logs_correlation;
DROP INDEX IF EXISTS idx_audit_logs_org_cat;

ALTER TABLE audit_logs
  DROP COLUMN IF EXISTS after_snapshot,
  DROP COLUMN IF EXISTS before_snapshot,
  DROP COLUMN IF EXISTS reason,
  DROP COLUMN IF EXISTS correlation_id,
  DROP COLUMN IF EXISTS category;
