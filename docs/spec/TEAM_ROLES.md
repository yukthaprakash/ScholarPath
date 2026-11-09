# TEAM ROLES — ScholarPath (3 people, 30 hours)

**Version 2.0 (Final) · 02 October 2026**

| | Person 1 | Person 2 | Person 3 |
|---|---|---|---|
| Title | Frontend + UX Lead | Backend + Data Platform Lead | Engine + Data Content + AI Lead |
| Owns | everything users see | storage, APIs, jobs, deploy, CI | decisions, rules, scheme data, AI |
| Folders | `frontend/` | `backend/`, DB, CI, deploy | `engine/`, `data/`, `ai/`, `tests/golden` |

No silent work transfers; changes are recorded in `TASK.md`.

---

## PERSON 1 — Frontend + UX Lead

**Mission:** a calm, minimal interface that makes the engine's reasoning obvious.

**Responsibilities**
1. Design tokens and ~15 components (`DESIGN.md §11`), PathSpine motif, status/urgency/trust components.
2. Pages: Landing, Quick Check, Wizard, Home, Explore (search/filter), Scheme (Receipt), Compare, Plan, Applications, Passport, Saved, Profile; Household (Tier C, simple).
3. USP surfaces: Receipt, Gap/Forecast, Unlock, Pre-flight, Planner, Trust, Conflicts, Tracker.
4. Data layer: typed API client, hooks, route guards, Demo adapter using local engine.
5. PWA: manifest, service worker caching, offline banner, print stylesheet for Last-Mile Kit.
6. i18n scaffolding (EN/KN/HI) and number/date formatting.
7. Accessibility and responsive QA (390–1440 px).

**Deliverables:** complete UI with demo flow; deployed frontend; accessibility report.
**Depends on:** P3 result shape and fixtures (H3); P2 endpoints (H9+).
**Done when:** every PRD acceptance item is clickable; Demo Mode works with backend off; Lighthouse accessibility ≥ 90 on Home and Scheme.

---

## PERSON 2 — Backend + Data Platform Lead

**Mission:** reliable, secure, versioned data platform and API; always deployable.

**Responsibilities**
1. Monorepo, env handling, lint, CI (tests + `data:check`).
2. DB schema (`ARCHITECTURE.md §3`), migrations, full-text search, indexes, RLS/authZ.
3. Auth (Firebase Google + Demo Mode), sessions, share tokens.
4. API (`ARCHITECTURE.md §6`): profile, documents, schemes search/filter, analyze (calls engine), plan, compare, conflicts, applications, radar, household, open API, AI proxy.
5. Ingestion: JSON → DB loader, `sources` snapshots + hash, `change_events`, audit log, rule versioning.
6. Jobs: source-check (weekly), trust-recompute (daily), reminders (daily).
7. Data QA: `data:check` script, link checker, reviewer for ≥ 10 schemes (two-person rule).
8. Deploy backend + DB; health, rate limiting, CORS, no PII in logs.

**Deliverables:** running API with OpenAPI docs; seeded DB; CI green; deployed backend.
**Depends on:** P3 schema + JSON by H4; P1 field list per page by H4.
**Done when:** all endpoints return typed data for the demo profile; works without AI key; fresh clone runs in three commands.

---

## PERSON 3 — Engine + Data Content + AI Lead

**Mission:** the correct, explainable, source-backed brain, and the data that feeds it.

**Responsibilities**
1. Types and rule schema; engine modules (`evaluate, match, unlock, forecast, conflicts, readiness, planner, trust, household`).
2. Scheme data: 30+ schemes from T1/T2 sources, with rules, documents, pre-flight checks, deadlines, renewal/SLA, conflicts, guides (`DATA_STRATEGY.md`).
3. Golden tests (≥ 3 profiles per scheme) and ≥ 60 engine unit tests.
4. USP logic: Receipt trace, distance, forecast, pre-flight evaluation, conflict best-stack, backward planner, trust score, radar impact.
5. AI layer: grounded explainer, translation, fallback, safety tests.
6. Demo profiles: a student with ≥ 6 matches, ≥ 3 nearly, ≥ 2 unlock actions, ≥ 1 forecast, ≥ 1 pre-flight issue, ≥ 1 conflict.
7. Data QA owner: link check, freshness, no fabricated claims.

**Deliverables:** `engine/` with tests; `data/` with README of sources; `ai/` module; golden suite.
**Depends on:** P2 loader/CI; P1 wording review of labels.
**Done when:** engine passes all tests; every scheme has source metadata; AI refuses out-of-context questions; USP outputs reproducible from data.

---

## Shared Contracts (agree in H0–4)
1. Types file and result shape — P3 owns.
2. API paths and error shape — P2 owns.
3. Profile field names — single source `engine/src/profileSchema.ts`.
4. Copy and labels — P1 owns wording, P3 verifies rule accuracy.
Changes through PR approved by both consumers.

## Cadence
H0 kickoff (20 min) · sync every 3 h (10 min) · integration checkpoints H12 and H21 · feature freeze H28.

## Handoffs
| Hour | P1 | P2 | P3 |
|------|----|----|----|
| 3 | Field list | Schema draft | Fixture + types → P1/P2 |
| 9 | Home on fixture | Analyze endpoint | Engine v1 → P2 |
| 14 | Receipt/Gap/Unlock UI | Plan, conflicts, compare APIs | Forecast, planner, conflicts, trust |
| 18 | Pre-flight, Tracker, Passport | Applications, radar, jobs | Pre-flight data, AI module |
| 21 | Integration checkpoint | Deployed backend | Data QA |
| 28 | Freeze | Freeze | Freeze |

## Git (Git Bash)
```bash
git checkout main && git pull origin main --rebase
git checkout -b p1/receipt-ui     # p2/… or p3/…
git add -A && git commit -m "feat(frontend): receipt rule list"
git pull origin main --rebase && git push -u origin p1/receipt-ui
```
Branches `pN/<feature>`; PR reviews ≤ 10 min; never force-push `main`; never commit `.env`.
