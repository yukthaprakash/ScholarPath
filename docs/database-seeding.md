# ScholarPath Scheme Database Seeder Documentation

This guide outlines prerequisites, migration steps, and how to safely seed scholarship scheme datasets from `data/schemes/*.json` into PostgreSQL.

---

## 1. Prerequisites

1. **Node.js 20+** installed.
2. **PostgreSQL 16** running locally or via Docker / cloud (e.g. Supabase, RDS).
3. **Environment Configuration**:
   Ensure `DATABASE_URL` is set in your environment or in `.env` (refer to `.env.example`).
   Example:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scholarpath_dev
   ```

---

## 2. Database Migration

Before seeding, ensure the database schema migrations have been applied. The seeder requires the `schemes` table and full-text search indexes created by migration `001_initial_schema.sql`.

To run migrations:
```bash
# From repository root
npm --workspace=backend run migrate

# Or directly in the backend folder
cd backend
npm run migrate
```

---

## 3. Dry-Run Mode (Safe Validation)

Dry-run mode reads the canonical scheme datasets, verifies them against `@scholarpath/engine` Zod schemas, inspects the database to identify which schemes are new versus existing, and outputs a summary **without executing any database writes or transactions**.

To run a dry-run:
```bash
# Using npm script from repository root
npm run seed:schemes:dry

# Or using flag
npm run seed:schemes -- --dry-run

# Or directly with tsx
npx tsx backend/src/cli/seedData.ts --dry-run
```

Expected dry-run output:
```text
[Scheme Seeder] Reading scheme datasets from .../data/schemes...
[Scheme Seeder] Found 6 scheme dataset file(s). Validating records...
[Scheme Seeder] DRY-RUN MODE: No database changes will be written.
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: aicte-pragati-degree ("AICTE Pragati Scholarship Scheme for Girl Students (Degree)")
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: karnataka-ssp-post-matric ("Karnataka SSP Post-Matric Scholarship & Fee Reimbursement")
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: nsp-central-sector-ug ("Central Sector Scheme of Scholarships for College and University Students")
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: nsp-post-matric-sc ("Post Matric Scholarship for Scheduled Caste Students (PMS-SC)")
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: nsp-post-matric-st ("Post Matric Scholarship for Scheduled Tribe Students (PMS-ST)")
[Scheme Seeder] [DRY-RUN] WOULD_INSERT: ugc-single-girl-child-pg ("UGC Post Graduate Indira Gandhi Scholarship for Single Girl Child")
[Scheme Seeder] DRY-RUN Summary: Valid=6, WouldInsert=6, WouldUpdate=0, Failed=0
```

---

## 4. Actual Database Seeding

Once verified, seed the local database:

```bash
# Using npm script from repository root
npm run seed:schemes
# Or
npm run db:seed

# Or directly in the backend workspace
npm --workspace=backend run seed:schemes
```

### Safety & Idempotency Features:
- **Parameterized Queries**: All fields are strictly parameterized; SQL interpolation is prohibited.
- **Atomic Transactions**: All inserts occur within `BEGIN ... COMMIT`; on error, `ROLLBACK` executes automatically.
- **Idempotent Upserts**: Uses `ON CONFLICT (slug) DO UPDATE`. Running the command repeatedly safely updates existing records without duplication or errors.
- **Schema & Connectivity Checks**: Fails with explicit error messages if PostgreSQL is offline or migrations have not been run.
- **Never Deletes Data**: Does not execute `DELETE` or `TRUNCATE`, preserving unrelated schemes, users, and profile data.
