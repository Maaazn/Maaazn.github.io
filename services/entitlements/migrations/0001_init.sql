CREATE TABLE IF NOT EXISTS entitlements (
  license_hash TEXT PRIMARY KEY,
  subscription_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('active', 'ended', 'refunded', 'disputed')),
  entitlement_until TEXT,
  updated_at TEXT NOT NULL,
  last_event_fingerprint TEXT
);

CREATE INDEX IF NOT EXISTS idx_entitlements_subscription
  ON entitlements(subscription_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  fingerprint TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  event_type TEXT NOT NULL
);
