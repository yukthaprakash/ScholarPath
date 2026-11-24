-- Migration 004: Create dataset_info table for tracking version and refresh timestamp

CREATE TABLE IF NOT EXISTS dataset_info (
  id SERIAL PRIMARY KEY,
  dataset_version TEXT NOT NULL,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a single row placeholder (id = 1) exists; safe to run multiple times
INSERT INTO dataset_info (id, dataset_version, last_refreshed_at)
VALUES (1, 'v0', NOW())
ON CONFLICT (id) DO NOTHING;

