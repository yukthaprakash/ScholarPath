-- Migration 003: Create scheme_audit table and triggers

CREATE TABLE IF NOT EXISTS scheme_audit (
  id SERIAL PRIMARY KEY,
  scheme_slug VARCHAR(255) NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  old_data JSONB,
  new_data JSONB,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by TEXT NOT NULL DEFAULT 'seed_script'
);

-- Function to log INSERT
CREATE OR REPLACE FUNCTION log_scheme_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO scheme_audit (scheme_slug, operation, old_data, new_data, performed_by)
  VALUES (NEW.slug, 'INSERT', NULL, to_jsonb(NEW), 'seed_script');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log UPDATE
CREATE OR REPLACE FUNCTION log_scheme_update() RETURNS trigger AS $$
BEGIN
  INSERT INTO scheme_audit (scheme_slug, operation, old_data, new_data, performed_by)
  VALUES (NEW.slug, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), 'seed_script');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log DELETE
CREATE OR REPLACE FUNCTION log_scheme_delete() RETURNS trigger AS $$
BEGIN
  INSERT INTO scheme_audit (scheme_slug, operation, old_data, new_data, performed_by)
  VALUES (OLD.slug, 'DELETE', to_jsonb(OLD), NULL, 'seed_script');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers on schemes table
DROP TRIGGER IF EXISTS scheme_insert_audit ON schemes;
DROP TRIGGER IF EXISTS scheme_update_audit ON schemes;
DROP TRIGGER IF EXISTS scheme_delete_audit ON schemes;

CREATE TRIGGER scheme_insert_audit AFTER INSERT ON schemes
FOR EACH ROW EXECUTE FUNCTION log_scheme_insert();

CREATE TRIGGER scheme_update_audit AFTER UPDATE ON schemes
FOR EACH ROW EXECUTE FUNCTION log_scheme_update();

CREATE TRIGGER scheme_delete_audit AFTER DELETE ON schemes
FOR EACH ROW EXECUTE FUNCTION log_scheme_delete();

