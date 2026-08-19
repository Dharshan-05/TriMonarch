-- UP
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  request_id VARCHAR(255),
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_org_timestamp ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_org_entity ON audit_logs(organization_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_org_user ON audit_logs(organization_id, user_id);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- DOWN
DROP TABLE IF EXISTS audit_logs CASCADE;
