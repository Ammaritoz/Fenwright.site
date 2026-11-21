-- Client portal dashboard snapshots.
--
-- Written by fenwright-watch (`fenwright-watch sync`), read by the portal
-- (lib/portal/dashboard.ts). The payload is exactly what dashboard.py
-- gather() returns: client-safe summary data only. Raw SBOMs, firmware paths
-- and AI usage never leave the pipeline machine.
--
-- Run once against the Neon project (neon-sky-book, fra1) as the owner role,
-- in the Neon SQL editor. Create the two login roles first in the Neon
-- console (Roles -> New role) so Neon generates the passwords:
--   portal_writer  -> its connection string is PORTAL_DB_WRITE_URL (pipeline .env)
--   portal_reader  -> its connection string is PORTAL_DB_READ_URL (Vercel + .env.local)

CREATE TABLE IF NOT EXISTS portal_snapshot (
  client_slug  TEXT PRIMARY KEY,
  generated_at TIMESTAMPTZ NOT NULL,
  payload      JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_snapshot_history (
  id           BIGSERIAL PRIMARY KEY,
  client_slug  TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  payload      JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS portal_snapshot_history_client_time
  ON portal_snapshot_history (client_slug, generated_at DESC);

-- Least privilege: the pipeline can write snapshots, the website can only read.
GRANT SELECT, INSERT, UPDATE ON portal_snapshot TO portal_writer;
GRANT INSERT ON portal_snapshot_history TO portal_writer;
GRANT USAGE ON SEQUENCE portal_snapshot_history_id_seq TO portal_writer;

GRANT SELECT ON portal_snapshot TO portal_reader;
GRANT SELECT ON portal_snapshot_history TO portal_reader;
