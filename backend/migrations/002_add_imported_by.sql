-- Migration 002: Add imported_by column to schemes table

ALTER TABLE schemes
  ADD COLUMN IF NOT EXISTS imported_by TEXT NOT NULL DEFAULT 'seed_script';

