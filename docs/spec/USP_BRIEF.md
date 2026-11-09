# USP BRIEF — 14 Differentiators

**Version 2.0 · 02 October 2026**

## Honest positioning
We reviewed the current landscape: **myScheme** (discovery + Yes/No eligibility questionnaires across 5,000+ schemes), **NSP** (application, OTR registration, two-level verification, status tracking, basic scheme suggestions), and listing sites (Buddy4Study-style) plus many unofficial "eligibility checker" pages. We could not find the capabilities below offered **together** as integrated features. Phrase this in the pitch as **"to our knowledge, not available in existing portals"**, and re-check before the final presentation. Do not claim absolute firsts.

| Gap in today's tools | ScholarPath answer |
|---|---|
| Binary "eligible / not eligible" with no clause evidence | USP 1, 3 |
| No what-if reasoning across schemes | USP 2 |
| Rejections discovered *after* submission | USP 4 |
| Overlapping scholarships discovered late | USP 5 |
| Documents handled per scheme, not per student | USP 6 |
| Deadlines shown, preparation time ignored | USP 7 |
| Rule changes unnoticed | USP 8 |
| Black box after "Submit" | USP 9 |
| Individual-only view | USP 10 |
| Digital-only, English-heavy flows | USP 11 |
| No data-quality transparency | USP 12 |

Tiers: **A** = must be in the demo · **B** = build if on schedule · **C** = schema + minimal UI, or roadmap slide.

---

## USP 1 — Eligibility Receipt (Tier A)
**Problem:** "You are eligible" is unverifiable.
**Solution:** Each result lists every rule: ✓/○/?, the student value used, the official clause/URL, the rule version and verification date. Shareable as a link and printable PDF ("receipt") to show a parent, teacher, or institute nodal officer.
**Mechanics:** `SchemeMatch.ruleTrace[]` with `ruleId, ruleVersion, studentValue, expected, outcome, sourceRef`.
**Demo moment:** Open a scheme → tap any ✓ → see the clause and source.

## USP 2 — Unlock Engine (Tier A)
**Problem:** Students don't know which single action opens the most doors.
**Solution:** Counterfactual simulation: for each actionable missing rule, re-run matching with it satisfied and rank actions by schemes unlocked.
**Mechanics:** `computeUnlocks(profile, schemes)`; cautious copy; only for documented criteria.
**Demo moment:** "Income certificate → +3 schemes potentially relevant."

## USP 3 — Distance-to-Eligibility & Next-Year Forecast (Tier A)
**Problem:** "Not eligible" is a dead end.
**Solution:** For numeric/time-based rules show the gap ("income ₹18,000 above limit", "needs 4.5% more marks"), and project eligibility at next semester/year (age, year of study, level change) using deterministic profile progression.
**Mechanics:** `distance(rule, value)`; `forecast(profile, +1 year)` re-runs the engine on a progressed profile; assumptions listed.
**Demo moment:** A "Not matched" card showing "You'd qualify if income ≤ limit — you're 7% above."

## USP 4 — Pre-Flight Rejection Check (Tier A)
**Problem:** Applications fail on avoidable mistakes.
**Solution:** A checklist of deterministic validations drawn from documented rejection causes: issuing authority acceptable?, certificate year/validity?, name & DOB consistent across documents (student confirms), Aadhaar–bank seeding, institute participation, OTR completed, photo/signature specs, overlapping scholarship declared.
**Mechanics:** `preflightChecks` per scheme in data (`checks[]` with `source`). Student answers Yes/No/Unsure; result "Ready / Fix first / Verify".
**Demo moment:** "Income certificate issued by Patwari → not accepted for this scheme; get it from Tehsildar/SDM" (value from data, with source).

## USP 5 — Benefit Conflict Resolver & Best Stack (Tier B)
**Problem:** Taking two overlapping scholarships can cause rejection or recovery.
**Solution:** A conflict graph (`exclusive_with`, `compatible_with`, `unknown`) from official guidelines. Recommends the best non-conflicting combination by potential benefit; unknown pairs flagged "Requires verification".
**Mechanics:** maximum-weight independent set over the conflict graph (small n; brute force/greedy is fine). Amounts labeled "potential".
**Demo moment:** "Pick A + C (compatible); B conflicts with A per Clause X."

## USP 6 — Certificate Passport (Tier B)
**Problem:** Students re-collect the same certificates per scheme and miss expiries.
**Solution:** One passport of document *metadata* (type, issuing authority, issue date, validity year). Shows "this one certificate serves 9 of your 12 schemes", flags expiry/wrong-year, and which authority to approach.
**Mechanics:** `documents` table with `valid_until`; `scheme_documents` mapping with `accepted_issuers`, `max_age_months`.
**Demo moment:** "Income certificate expires for AY 2027–28 — renew by …".

## USP 7 — Critical-Path Deadline Planner (Tier A)
**Problem:** A deadline date hides the lead time of getting documents.
**Solution:** Backward scheduling: for each missing document, use typical processing time (from guides) to compute "start by" dates, then order tasks by the earliest start. Flags impossible plans ("deadline in 5 days, certificate takes 7–15 days → use institute helpdesk / check extension").
**Mechanics:** `planBackwards(deadline, tasks[{id,durationMin,durationMax}])`; uses conservative (max) duration; durations come from `data/guides` with source; if unknown → "unknown, verify".
**Demo moment:** "Deadline 31 Oct → Start income certificate by 10 Oct."

## USP 8 — Scheme Change Radar (Tier C)
**Problem:** Income limits, deadlines, and documents change; students use stale information.
**Solution:** Rules are versioned; a change log records field-level diffs; users with saved schemes get "What changed and does it affect you?" notes.
**Mechanics:** `scheme_rule_versions`, `change_events`; weekly source-hash check (job) + human review; impact = rerun engine on affected profiles.
**Demo moment:** Seeded change event: "Limit changed A → B; you moved from Not matched to Eligible."

## USP 9 — Verification-Stage Tracker (Tier B)
**Problem:** After submission, students don't know which stage is stuck or what to do.
**Solution:** A stage timeline (Submitted → Institute verification → District/State verification → Sanction → Payment) with expected windows from data, countdown, and "what to do if stuck" with copy-ready, polite escalation messages for the institute nodal officer or helpdesk.
**Mechanics:** `applications.stage_history`; user-updated (no portal integration); `sla` windows per scheme from sources.
**Demo moment:** "Institute verification pending 12 days — message template ready."

## USP 10 — Household Mode (Tier C)
**Problem:** Families have multiple students and shared documents.
**Solution:** One household, multiple student profiles, shared parent-level fields (income, category, domicile); single plan listing tasks that serve several siblings.
**Mechanics:** `households`, `household_members`; shared fields override at engine call.
**Demo moment:** "One income certificate unlocks 4 schemes across 2 siblings."

## USP 11 — Last-Mile Kit (Tier B)
**Problem:** Many students depend on help centres and have patchy connectivity.
**Solution:** Printable one-page *Application Kit* (documents, where to get each, expected time, links), offline-capable PWA, multilingual UI (EN/KN/HI), voice input (stretch), and a **Helper Hand-off**: short code/QR that shows a read-only profile summary to a CSC operator or teacher.
**Mechanics:** PWA service worker caching of scheme JSON; `i18n` JSON; print stylesheet; share token with expiry and view-only scope.
**Demo moment:** Toggle Kannada; print kit; airplane mode still shows the plan.

## USP 12 — Data Trust Score (Tier A)
**Problem:** Students can't tell if information is current.
**Solution:** Each scheme shows a **freshness/quality indicator**: days since last verification, source tier (T1 official guideline/portal, T2 official notification summary, T3 secondary), and rule coverage ("8 of 9 conditions encoded"). This is about *data quality*, never eligibility.
**Mechanics:** `trustScore = f(verifiedAge, sourceTier, coverage)` shown as labelled levels (High/Medium/Low) with reasons; below threshold → "Needs verification".
**Demo moment:** Badge: "Verified 2 days ago · Official guideline · 9/9 rules encoded".

## USP 13 — Renewal Radar (Tier C)
**Problem:** Renewals have different requirements (marks, attendance, fresh certificates).
**Solution:** Per-scheme renewal rules; the planner schedules renewal tasks next academic year and warns early.
**Mechanics:** `scheme_renewal_rules`; planner runs with `mode='renewal'`.

## USP 14 — Open Rules API (Tier C)
**Problem:** Institutes, NGOs, and other builders can't reuse structured scheme rules.
**Solution:** Public read-only endpoints (`/open/schemes`, `/open/rules`) with citations and versions, under a clear license and rate limits. Positions the project as a public good.
**Mechanics:** Read-only views of verified data; no personal data.

---

## Priority for the 30-hour build
**Tier A (7):** USP 1, 2, 3, 4, 7, 12 plus the core engine — these are computed from data already in the schema and make the demo.
**Tier B (4):** USP 5, 6, 9, 11 — build in the polish window if on track.
**Tier C (4):** USP 8, 10, 13, 14 — schema and API stubs now, one seeded example each, shown on the roadmap slide.
