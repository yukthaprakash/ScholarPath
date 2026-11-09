# PRD — ScholarPath

**Version 2.0 (Final) · 02 October 2026 · AY 2026–27**

## 1. Problem
Students must figure out which scholarships and welfare schemes apply, why, what is missing, what documents to get and from whom, whether schemes conflict, and how to meet deadlines. Information is fragmented and written in dense language; rejections are discovered late.

## 2. Users
Primary: college students (UG/PG/diploma/professional). Secondary: school students, parents, first-generation learners, CSC/helpdesk operators, college nodal officers (as helpers).

## 3. Goals
1. Match students to relevant schemes from entered criteria (PS core).
2. Make every result explainable and source-backed.
3. Turn eligibility into preparation and action (documents, deadlines, tracking).
4. Prevent avoidable rejection and overlap.
5. Be trustworthy about data freshness.
6. Work for low-connectivity, multilingual, assisted use.

## 4. Non-Goals
No application submission, no guarantee of approval, no document authenticity verification, no legal advice, no fabricated rules, no replacing official portals.

## 5. Problem-Statement Traceability
| PS element | Where satisfied |
|------------|-----------------|
| "Web tool" | Responsive React app + PWA |
| "matching students" | Eligibility DNA + rule engine |
| "eligible scholarships" | Scholarship/fellowship/fee-waiver catalogue |
| "welfare schemes" | Welfare/hostel/stipend/loan-subsidy catalogue (same schema, `type` field) |
| "entered criteria" | 5-step wizard + quick-check mode (6 fields) |

## 6. Information Architecture
**Public:** Landing · How it works · Data & trust · Quick Check (no sign-in)
**Signed in:** Home (next best action) · Matches · Explore (search/filter) · Compare · Saved · Plan (action + deadlines) · Applications (tracker) · Passport (documents) · Household · Profile
**Scheme page:** Summary → Receipt (why) → Missing & distance → Pre-flight → Documents → Deadline & plan → Conflicts → Official links → Trust badge

## 7. Core Flow
```text
Landing → Quick Check (optional) → Sign in / Demo → Wizard (Eligibility DNA)
→ Analyze → Home: Next best action + results
→ Scheme → Receipt → Gaps/Unlock → Pre-flight → Plan → Official application
→ Track stages → Renewal
```

## 8. Eligibility DNA (fields)
| Group | Fields |
|-------|--------|
| Identity | age, gender (only if needed), state, district, rural/urban |
| Education | level, course/stream, year/semester, institution type, % / CGPA (normalized), previous-year result |
| Finance | annual family income (number + bracket), income cert details (issuer, issue date) |
| Social | category (General/OBC/SC/ST/EWS/Minority), disability (%), others only if a scheme needs them |
| Context | household size, single parent, first-generation (only if used by schemes) |
| Documents | type, issuer, issue date, validity year (metadata only) |
| Other | currently availing scholarships (for conflict check) |

Collect only what schemes use; each field shows "Why we ask this".

## 9. Match States
ELIGIBLE · NEARLY_ELIGIBLE · NOT_MATCHED · NEEDS_VERIFICATION. Uncertainty is never hidden.

## 10. Feature Requirements (condensed)

### F1 Quick Check
6-field instant result (state, level, course, category, income, gender optional) → count of potential matches, with prompt to sign in for the full plan.

### F2 Wizard
5 steps, save per step, inline validation, resume later, edit anytime; changes trigger re-analysis.

### F3 Matching & Explanation (USP 1, 3)
Every result includes rule trace, distance for numeric rules, and next-year forecast when relevant.

### F4 Unlock Engine (USP 2)
Ranked actions with counts and cautious copy.

### F5 Search / Filter / Compare
Full-text over name, authority, description; filters: type, level, state/central, authority, category, deadline window, status; sort by deadline, readiness, match state. Compare up to 3 schemes on benefits, key rules, documents, deadline, conflicts.

### F6 Pre-Flight (USP 4) and Passport (USP 6)
Per-scheme checks, per-student document metadata, expiry warnings.

### F7 Planner (USP 7, 13)
Backward plan from deadline; urgency colours (🔴 ≤7d, 🟠 ≤30d, 🟢 later) plus text labels; renewal scheduling.

### F8 Conflicts (USP 5)
Pairwise states COMPATIBLE / INCOMPATIBLE / REQUIRES_VERIFICATION / UNKNOWN; best stack suggestion; totals "potential".

### F9 Tracker (USP 9)
Stages, user-updated, SLA windows, escalation templates, notes.

### F10 Radar (USP 8), Household (USP 10), Kit (USP 11), Trust (USP 12), Open API (USP 14)
As in `USP_BRIEF.md`.

### F11 AI Explainer
Grounded Q&A on a scheme using verified data and the engine result; labelled "AI explanation"; fallback to static labels.

### F12 Notifications
In-app first; email optional. Types: deadline, missing document, expiry, rule change, stage stuck.

### F13 Languages & Accessibility
EN/KN/HI UI strings; scheme summaries translated by AI (flagged) or pre-translated for top schemes; keyboard navigation, focus, labels, contrast, no colour-only meaning.

## 11. Acceptance Criteria (judge-visible)
1. Complete profile; get results in under 3 minutes.
2. Open a scheme; tap a ✓ and see the source clause.
3. See a numeric gap on a Not matched scheme.
4. See Unlock ranking.
5. Run Pre-flight and see a documented rejection risk.
6. See backward plan with a "start by" date.
7. See Trust badge with freshness and source tier.
8. Compare two schemes and see a conflict state.
9. Open the official link.
10. Works in Demo Mode with backend off.

## 12. Success Metrics
Time to first useful match · % profiles with ≥1 match · actions generated · pre-flight issues caught · schemes saved · official-link clicks · % schemes with High trust · test-suite pass rate.

## 13. Principle
**Eligibility → Understanding → Preparation → Action.**
