-- Migration 001: Initial Schema for ScholarPath Phase 2

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  auth_mode VARCHAR(50) NOT NULL DEFAULT 'demo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles Table (Eligibility DNA)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  category VARCHAR(50),
  religion VARCHAR(50),
  domicile_state VARCHAR(100),
  is_differently_abled BOOLEAN DEFAULT false,
  disability_percentage NUMERIC(5, 2),
  annual_family_income NUMERIC(12, 2),
  education_level VARCHAR(50),
  current_course VARCHAR(255),
  course_year INT,
  academic_percentage NUMERIC(5, 2),
  institute_name VARCHAR(255),
  institute_state VARCHAR(100),
  is_single_girl_child BOOLEAN DEFAULT false,
  parent_occupation VARCHAR(100),
  extra_attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on profiles user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 3. Document Metadata Table (Metadata only - NO RAW FILES)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issued_on DATE NOT NULL,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- 4. Schemes Table
CREATE TABLE IF NOT EXISTS schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  short_description TEXT,
  full_description TEXT,
  type VARCHAR(100) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  state VARCHAR(100),
  authority VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  financial_benefit TEXT,
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  official_url TEXT,
  application_url TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  trust_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on schemes
CREATE INDEX IF NOT EXISTS idx_schemes_slug ON schemes(slug);
CREATE INDEX IF NOT EXISTS idx_schemes_type ON schemes(type);
CREATE INDEX IF NOT EXISTS idx_schemes_scope ON schemes(scope);
CREATE INDEX IF NOT EXISTS idx_schemes_state ON schemes(state);
CREATE INDEX IF NOT EXISTS idx_schemes_authority ON schemes(authority);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_deadline ON schemes(deadline);
CREATE INDEX IF NOT EXISTS idx_schemes_is_active ON schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_schemes_tsv ON schemes USING GIN(tsv);

-- Trigger to automatically update tsvector column for full-text search
CREATE OR REPLACE FUNCTION schemes_trigger_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
             setweight(to_tsvector('english', coalesce(NEW.authority, '')), 'B') ||
             setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
             setweight(to_tsvector('english', coalesce(NEW.short_description, '')), 'C') ||
             setweight(to_tsvector('english', coalesce(NEW.full_description, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON schemes;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON schemes FOR EACH ROW EXECUTE FUNCTION schemes_trigger_tsvector_update();
