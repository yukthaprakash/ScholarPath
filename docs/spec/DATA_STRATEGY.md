# DATA STRATEGY — The Backend Backbone

**Version 2.0 · 02 October 2026**

The product is only as good as its data. This document defines what we collect, from where, how it is verified, and what the engine may rely on.

## 1. Coverage Targets
| Level | Target | Notes |
|-------|--------|-------|
| 30-hour MVP | **30+ verified schemes** | Must pass all quality gates |
| Stretch | 60+ | Only if gates still pass |
| Demo state | Karnataka + Central | Add other states by data only (no code change) |

Quality beats quantity: 30 verified schemes with trace and sources beat 300 unverified.

## 2. Scheme Mix (for a convincing demo)
- Central: NSP-hosted central schemes (post-matric and merit-based families, category-specific, disability, top-class/fellowship types)
- Central sector / agency: AICTE, UGC, and ministry schemes
- State: Karnataka state scholarship and welfare programs relevant to students (post-matric, fee reimbursement, hostel/stipend, minority, and similar)
- Welfare beyond scholarships: hostel/stipend, fee waiver, education loan interest subsidy, bus pass or similar (only where official)
- Institution/CSR scholarships: Tier 3, marked clearly, excluded from authoritative matching unless verified

Do not guess scheme names or values from memory. Build the list from the official portals and record it in `data/README.md`.

## 3. Source Tiers
| Tier | Source type | Use |
|------|-------------|-----|
| T1 | Official guideline PDF/gazette or official scheme page (scholarships.gov.in, ministry/department/state portals) | Authoritative rules |
| T2 | Official portal listing/FAQ or official notification summary | Authoritative with note |
| T3 | Secondary articles, aggregators | Leads only; never the sole source for a rule |

Rule: every rule needs at least one T1/T2 `sourceRef`. T3 can only suggest what to verify.
(Several public articles that mention NSP 2026–27 dates and limits are T3; confirm on scholarships.gov.in before encoding.)

## 4. Scheme Record Checklist
- Identity: slug, name, type, authority, level/state scope
- Benefit text exactly as published (no invented amounts); `amountNote` may be "varies, see guideline"
- Rules (structured) with labels in en/kn/hi and `sourceRef` (url + clause)
- Required documents with accepted issuers and max age
- Pre-flight checks with failure messages and sources
- Deadline date + source + `verifiedAt`
- Renewal rules and SLA windows (if published)
- Conflict statements (e.g. "cannot avail another similar scholarship") → `scheme_conflicts`
- Official URL and application URL
- `lastVerified`, reviewer, `demo` flag

## 5. Verification Workflow (two-person rule)
```text
Collector (P3)  → drafts JSON from T1/T2 source, saves snapshot + hash
Reviewer (P2 or P1) → re-reads the source, checks every value, signs off
CI validation   → schema check, URL format, required fields, test cases
Merge           → trust level computed
```
No scheme is `demo: false` without reviewer sign-off. Disagreement → mark the field `UNKNOWN` and set `NEEDS_VERIFICATION`.

## 6. Automated Quality Gates (`npm run data:check`)
- JSON schema valid; every rule has `sourceRef.tier ≤ 2`
- No scheme without `officialUrl`, `applicationUrl`, `lastVerified`
- `lastVerified` ≤ 60 days or flagged
- Deadline present with `deadlineSource` or explicitly `null`
- Conflicts reference existing schemes; symmetric where relevant
- Labels exist in en; kn/hi missing → warning
- Link check (HEAD request) for official URLs
- Golden tests: ≥ 3 test profiles per scheme (match, near-miss, fail)

## 7. Golden Test Data
`tests/golden/` contains profile + expected result per scheme. A rule change that alters a golden result must update the golden file in the same PR with an explanation. This is what makes the engine trustworthy.

## 8. Trust Score Computation
```text
freshness:  ≤14d High · ≤45d Medium · >45d Low
tier:       best source tier among rules
coverage:   encodedRules / publishedConditions
level = lowest of the three (with reasons shown)
```
Low → "Needs verification" banner; excluded from "Ready to apply" lists.

## 9. Guides Data (Certificate Procurement)
For each common document (income, caste/category, domicile, bonafide, disability, bank/Aadhaar seeding): issuing authority, steps, typical duration (min/max days, only if published), portal link, `verified_on`. State-specific guides for the demo state. Durations unknown → show "varies; check with the issuing office".

## 10. Change Management
Weekly `source-check`: refetch URLs, compare hash, create `change_events`. A human decides the new version; `scheme_rule_versions` stores history; users with the scheme saved get a Radar item with "affects you / doesn't affect you" computed by re-running the engine.

## 11. Legal and Ethical
Use official public information; respect site terms and robots; no scraping behind logins; attribute sources; do not store personal certificate images; Open API contains no personal data; publish a "How we verify" page.

## 12. Ownership
P3 owns collection, schema, golden tests. P2 owns ingestion, jobs, DB integrity, CI check. P1 reviews labels/wording and displays trust and source UI. Everyone reviews at least 8 schemes.
