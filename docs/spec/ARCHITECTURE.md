# ARCHITECTURE — ScholarPath

**Version 2.0 (Final) · 02 October 2026**

## 1. Philosophy
Deterministic engine decides; data is versioned and cited; AI explains.

```text
React PWA ── REST API ── Services ── Engine (pure TS) ── PostgreSQL
                │            │
                │            └─ AI service (read-only, grounded)
                └─ Jobs: source-hash check, freshness recompute, reminders
```

## 2. Engine Modules (`engine/src`)
| Module | Function |
|--------|----------|
| `evaluate.ts` | rule → SATISFIED / FAILED / UNKNOWN with value + distance |
| `match.ts` | scheme → state + ruleTrace |
| `unlock.ts` | counterfactual simulation, ranked actions |
| `forecast.ts` | progress profile (+1 semester/year) and re-match |
| `conflicts.ts` | pair states + best stack (max-weight independent set) |
| `readiness.ts` | document/preflight readiness |
| `planner.ts` | backward scheduling, urgency, renewal mode |
| `trust.ts` | freshness / source tier / coverage → level |
| `household.ts` | merge shared fields, multi-student tasks |
| `types.ts` | shared types |
All pure functions; same code runs in backend and frontend Demo Mode.

## 3. Database (PostgreSQL)

```text
users(id, email, locale, created_at)
households(id, owner_id) ; household_members(household_id, profile_id, role)
student_profiles(id, user_id, household_id, data jsonb, updated_at)
documents(id, profile_id, doc_type, issuer, issued_on, valid_until, notes)  -- metadata only

schemes(id, slug, name, type, authority, level_scope, state_scope, category_tags[],
        description, benefits jsonb, official_url, application_url, status,
        deadline_date, deadline_source, deadline_verified_at, renewal jsonb, sla jsonb,
        trust jsonb, demo bool, search_tsv tsvector)
scheme_rules(id, scheme_id, rule_key, field, operator, value jsonb, required bool,
             actionable bool, label_en, label_kn, label_hi, source_ref, version)
scheme_rule_versions(id, rule_id, version, value jsonb, changed_on, changed_by, reason)
scheme_documents(id, scheme_id, doc_type, required bool, accepted_issuers[], max_age_months, notes)
scheme_preflight(id, scheme_id, check_key, question, failure_message, source_ref, severity)
scheme_conflicts(id, scheme_a, scheme_b, state, source_ref, note)
guides(id, doc_type, state_scope, issuing_authority, steps jsonb, duration_min_days,
       duration_max_days, portal_url, source_ref, verified_on)
sources(id, scheme_id, url, tier, fetched_on, content_hash, snapshot_path, reviewer)
change_events(id, scheme_id, field, old_value, new_value, detected_on, status)

saved_schemes(user_id, scheme_id, note, created_at)
applications(id, profile_id, scheme_id, stage, stage_history jsonb, deadline, notes, updated_at)
notifications(id, user_id, type, payload jsonb, due_at, read_at)
share_tokens(id, profile_id, scope, expires_at)
audit_log(id, actor, action, entity, entity_id, diff jsonb, at)
```
Indexes: GIN on `search_tsv`, btree on `(state_scope, type)`, `(deadline_date)`; unique `(scheme_id, rule_key, version)`.
RLS (Supabase) or API-level checks ensure a user only reads own profile/applications.

## 4. Rule Format
```json
{
  "ruleKey": "income_limit",
  "field": "annualIncome",
  "operator": "less_than_or_equal",
  "value": 250000,
  "required": true,
  "actionable": false,
  "label": { "en": "Annual family income within the limit", "kn": "…", "hi": "…" },
  "sourceRef": { "url": "<official>", "clause": "<section>", "tier": 1 },
  "version": 1
}
```
Operators: equals, not_equals, in, not_in, gt, gte, lt, lte, range, exists, contains, date_within.
`distance` is computed for numeric/date operators.

## 5. Matching Result
```json
{
  "schemeId": "…",
  "status": "NEARLY_ELIGIBLE",
  "ruleTrace": [
    { "ruleKey": "income_limit", "outcome": "SATISFIED", "studentValue": 180000, "expected": "<= 250000", "version": 1, "sourceRef": {} },
    { "ruleKey": "income_cert", "outcome": "FAILED", "actionable": true, "reason": "document missing" }
  ],
  "distance": [{ "ruleKey": "percentage", "gap": 4.5, "unit": "%" }],
  "forecast": { "nextYear": "ELIGIBLE", "assumptions": ["year of study +1"] },
  "readiness": { "ready": 6, "total": 8, "missing": ["domicile"] },
  "preflight": { "issues": [], "unsure": [] },
  "trust": { "level": "HIGH", "verifiedDaysAgo": 2, "tier": 1, "coverage": "9/9" },
  "conflicts": [{ "with": "scheme_x", "state": "INCOMPATIBLE" }],
  "plan": { "deadline": "…", "tasks": [{ "id": "income_cert", "startBy": "…" }] }
}
```
State derivation (documented, tested):
1. Any required, non-actionable rule FAILED → NOT_MATCHED
2. Else any required, non-actionable rule UNKNOWN → NEEDS_VERIFICATION
3. Else any required, actionable rule unsatisfied → NEARLY_ELIGIBLE
4. Else ELIGIBLE
Trust below threshold forces a "Needs verification" banner without changing the rule outcome.

## 6. API
| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/session | Session or demo |
| POST | /quick-check | Stateless 6-field matching |
| GET/PUT | /profile | Eligibility DNA |
| GET/POST/DELETE | /documents | Passport metadata |
| GET | /schemes | Search + filters + pagination |
| GET | /schemes/:slug | Detail + sources + trust |
| POST | /eligibility/analyze | Full results |
| GET | /opportunities/unlock, /missed | Unlock and missed |
| POST | /preflight/:schemeId | Evaluate answers |
| GET | /plan | Backward plan across saved/target schemes |
| GET | /conflicts?ids= | Pair states + best stack |
| GET | /compare?ids= | Comparison payload |
| GET/PUT | /applications/:id | Tracker |
| GET | /radar | Change events affecting the user |
| GET/POST | /household | Members |
| POST | /share-token | Helper hand-off |
| POST | /ai/explain | Grounded explanation |
| GET | /open/schemes, /open/rules | Open API |
| GET | /health | Health |

Error shape `{ "error": { "code", "message", "details" } }`; Zod validation on all inputs; rate limiting; request IDs.

## 7. Jobs
| Job | Schedule | Action |
|-----|----------|--------|
| `source-check` | weekly | refetch source URLs, compare hash, open `change_events` for review |
| `trust-recompute` | daily | recompute freshness levels |
| `reminders` | daily | deadlines, expiries, stuck stages → notifications |
| `forecast-warm` | on profile change | cache analysis |

## 8. AI Service
Server-side only. Context = scheme JSON + engine result + question. Rules: answer from context only; "not in verified data" otherwise; label output; 8 s timeout → static fallback; never modifies results; log prompts without personal data.

## 9. Offline / PWA
Service worker caches app shell, `data/schemes` bundle (versioned), and user's last analysis. Demo Mode uses local engine and bundled JSON; banner shows "Demo Mode".

## 10. i18n
`react-i18next`, namespaces per page; rule labels carried in data (en/kn/hi); fallback to English; numbers in Indian format (lakh/crore).

## 11. Security
Env secrets, server-side AI key, authN/authZ, input validation, rate limits, CORS allow-list, no PII in logs, share tokens scoped and expiring, certificate metadata only.

## 12. Observability
Structured logs, health endpoint, error tracking (optional), engine test-suite in CI, data validation script in CI (see `DATA_STRATEGY.md`).
