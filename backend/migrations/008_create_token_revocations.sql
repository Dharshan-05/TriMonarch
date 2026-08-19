-- UP
CREATE TABLE IF NOT EXISTS auth_token_revocations (
  jti VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_revocations_expires_at ON auth_token_revocations(expires_at);

-- DOWN
DROP TABLE IF EXISTS auth_token_revocations CASCADE;
