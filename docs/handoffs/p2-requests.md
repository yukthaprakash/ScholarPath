# Backend & Data Platform (Person 2) Handoff Requests

**Date:** 2026-10-05  
**Owner:** Person 2 — Backend + Data Platform Lead  
**Branch:** `saksham-backend`  

---

## 1. Context & Status
Phase 1 of the backend foundation is established. The infrastructure (Node 20, Express, strict TypeScript, PostgreSQL connection pool, migration runner harness, Pino logging with PII redaction, Helmet, CORS, and dual-mode auth scaffolding) is functional.

Implementation of Phase 2 (database tables, Zod API contracts, evaluation orchestration, and scheme endpoints) is strictly blocked pending authoritative contracts and specifications from teammates.

---

## 2. Requests for Person 1 (Frontend & AI / Engine Integration)

1. **Authoritative Engine Interface & Types (`@scholarpath/engine`):**
   - The backend strictly abides by Core Architectural Principle 4: *The API must not decide eligibility*.
   - We require the exact TypeScript interfaces for:
     - `StudentProfile` (input contract: required/optional demographic, academic, income, and domicile fields).
     - `EvaluationResult` (output contract: match statuses `ELIGIBLE`, `NEARLY_ELIGIBLE`, `NOT_MATCHED`, `NEEDS_VERIFICATION`).
     - `EligibilityReceipt` (clause-level proof structure: rule code, passed boolean, threshold, student value, source citation).
     - `UnlockSimulationResult` (contract for what-if simulations).
     - `BenefitConflictGraph` (contract for exclusion handling).
   - *Current Backend State:* Backend has scaffolded `backend/src/services/engineAdapter.ts` with minimal structural stubs until `@scholarpath/engine` is ready.

2. **Frontend API Contract Alignment:**
   - Confirmation of query parameter formats for search and filtering (`/api/v1/schemes`).
   - Expected error code preferences for the standardized error envelope (`{ error: { code, message, details, requestId } }`).

---

## 3. Requests for Person 3 (Data Lead)

1. **Authoritative Scheme Dataset (`data/schemes/`):**
   - The backend team will **not** fabricate government scholarship records or invent eligibility criteria.
   - We require the verified scheme JSON files under `data/schemes/<slug>.json` to build the database seeding pipeline (`backend/src/cli/seedData.ts`).

2. **Data Provenance & Source Metadata Standards:**
   - Confirmation of required provenance fields per scheme and per rule:
     - `source`: Authority name / issuing department.
     - `sourceVersion`: Official notification or guideline reference.
     - `sourceHash`: SHA-256 hash of the source document/URL snapshot.
     - `sourceTier`: Source reliability tier (Tier 1 Gazette/Portal, Tier 2 State Department, Tier 3 Secondary).
     - `officialUrl` and `applicationUrl`.
     - `lastVerified`: ISO 8601 timestamp.
     - `dataTrustScore`: Calculation or predefined value.

---

## 4. Documentation Blocker (All Team Members)

The following 5 specification documents referenced in `README.md` are not yet committed to the Git repository:

1. `docs/spec/ARCHITECTURE.md` (specifically Section 3 for relational tables, indexes, and full-text search)
2. `docs/spec/DATA_STRATEGY.md` (scheme JSON schemas and verification workflows)
3. `docs/spec/RULES.md` (non-negotiable eligibility rule grammar)
4. `docs/spec/PRD.md` (acceptance criteria and field-level validation boundaries)
5. `docs/spec/USP_BRIEF.md` (detailed mechanics for the 14 USPs)

Please commit or push these files as soon as they are drafted so that we can write `backend/migrations/001_initial_schema.sql` and the Zod request/response schemas with zero guesswork.
