CREATE TABLE IF NOT EXISTS synced_reports (
  id TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  label TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  initial_index INTEGER NOT NULL,
  rule_pack_version TEXT NOT NULL,
  error_count INTEGER NOT NULL,
  warning_count INTEGER NOT NULL,
  info_count INTEGER NOT NULL,
  finding_ids_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (owner_hash, id)
);

CREATE INDEX IF NOT EXISTS idx_synced_reports_owner_saved
  ON synced_reports(owner_hash, saved_at DESC);
