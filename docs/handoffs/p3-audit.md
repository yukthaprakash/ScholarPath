# Person 3 (Eligibility Engine + Data + AI Lead) — Audit Report

**Date:** 2026-10-05  
**Auditor:** Person 3 (Staff Engineer)  
**Scope:** `engine/`, `data/`, `ai/`, `tests/`

---

## 1. Data Provenance & Browser Verification Audit

> **Honest Transparency Declaration:**  
> During the initial skeleton initialization step, no automated browser subagent was executed to inspect live DOM/PDF elements for the 5 initial scheme files (`nsp-central-sector-ug`, `nsp-post-matric-sc`, `aicte-pragati-degree`, `karnataka-ssp-post-matric`, `ugc-single-girl-child-pg`). Their rules, amounts, deadlines, document requirements, and URLs were populated from standard knowledge bases. Consequently, **all 5 initial schemes remain strictly flagged as `demo: true`**, and every unconfirmed field is cataloged in `data/TODO-verify.md` pending live browser verification against Tier 1/2 official portals.

### Audit per Scheme File (`data/schemes/*.json`)

| Scheme Slug | Parameter / Rule | Value | Source Status | Source URL & Verification Target |
|-------------|------------------|-------|---------------|----------------------------------|
| `nsp-central-sector-ug` | Income Limit | <= ₹4,50,000 | Memory (Unconfirmed) | https://scholarships.gov.in (NSP Scheme Guidelines) |
| | Score Threshold | >= 80% / 80th percentile | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Education Level | UNDERGRADUATE | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Benefit Amount | ₹12,000/yr | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Deadline | 2026-10-31 | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Certificates | Income, Marksheet, Bonafide | Memory (Unconfirmed) | https://scholarships.gov.in |
| `nsp-post-matric-sc` | Caste Category | SC | Memory (Unconfirmed) | https://socialjustice.gov.in / https://scholarships.gov.in |
| | Income Limit | <= ₹2,50,000 | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Education Level | Post-Matric (Diploma/UG/PG) | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Benefit Amount | ₹13,500/yr (Max maintenance) | Memory (Unconfirmed) | https://scholarships.gov.in |
| | Deadline | 2026-10-31 | Memory (Unconfirmed) | https://scholarships.gov.in |
| `aicte-pragati-degree` | Gender | FEMALE | Memory (Unconfirmed) | https://www.aicte-india.org/schemes/students-development-schemes/PRAGATI |
| | Income Limit | <= ₹8,00,000 | Memory (Unconfirmed) | https://www.aicte-india.org |
| | Education Level | UNDERGRADUATE (1st Year) | Memory (Unconfirmed) | https://www.aicte-india.org |
| | Benefit Amount | ₹50,000/yr | Memory (Unconfirmed) | https://www.aicte-india.org |
| | Deadline | 2026-10-31 | Memory (Unconfirmed) | https://www.aicte-india.org |
| `karnataka-ssp-post-matric` | Domicile | KARNATAKA | Memory (Unconfirmed) | https://ssp.postmatric.karnataka.gov.in |
| | Income Limit | <= ₹2,50,000 | Memory (Unconfirmed) | https://ssp.postmatric.karnataka.gov.in |
| | Benefit Amount | ₹25,000/yr | Memory (Unconfirmed) | https://ssp.postmatric.karnataka.gov.in |
| | Deadline | 2026-11-30 | Memory (Unconfirmed) | https://ssp.postmatric.karnataka.gov.in |
| `ugc-single-girl-child-pg` | Single Girl Child | true | Memory (Unconfirmed) | https://www.ugc.gov.in |
| | Education Level | POSTGRADUATE | Memory (Unconfirmed) | https://www.ugc.gov.in |
| | Age Limit | <= 30 years | Memory (Unconfirmed) | https://www.ugc.gov.in |
| | Benefit Amount | ₹36,200/yr | Memory (Unconfirmed) | https://www.ugc.gov.in |

---

## 2. Pre-Flight Guidance Categorization Audit

The following pre-flight checks currently in `engine/src/differentiators/evaluatePreflight.ts` are administrative rejection patterns derived from public service delivery reports rather than statutory scheme clauses:

1. **Aadhaar-Bank DBT Seeding (`isAadhaarSeededWithBank`)**: Relabeled as **"General Guidance"** (Rejection Cause #1).
2. **Name Mismatch across Marksheet & Aadhaar (`isNameMatchingAadhaar`)**: Relabeled as **"General Guidance"** (Rejection Cause #2).
3. **Date of Birth Mismatch (`isDobMatchingAadhaar`)**: Relabeled as **"General Guidance"** (Rejection Cause #3).
4. **Institute AISHE / Portal Registration (`isInstituteGovtRegistered`)**: Relabeled as **"General Guidance"** (Rejection Cause #4).

---

## 3. Algorithm & Schema Audit Adjustments Required

### `computeUnlocks` Ranking Logic Adjustment
- **Current Behavior:** Ranks actionable unlock actions by `additionalFinancialUnlocked` descending.
- **Required Adjustment:** Update `computeUnlocks.ts` to rank primarily by `schemesUnlocked.length` (number of schemes unlocked descending). Financial yield will serve strictly as a secondary tie-breaker when sourced.

---

## 4. Scheme Field & Golden Profile Gap Analysis

Every scheme in `data/schemes/` must adhere to the following unified schema:
- `officialUrl`: Primary Portal URL.
- `applicationUrl`: Exact Login / Registration URL.
- `lastVerified`: ISO Date string (`YYYY-MM-DD`).
- `sourceRef`: `{ url, clause, tier, readOn }`.
- `goldenProfiles`: Minimum 3 golden profiles per scheme (`match`, `near-miss`, `fail`).

### Identified Gaps:
1. Missing explicit `applicationUrl` field on current scheme JSON files.
2. Missing `sourceRef.readOn` field on current scheme JSON files.
3. Golden test coverage exists for `nsp-central-sector-ug`; missing dedicated golden profiles for remaining schemes.

---

## 5. Audit Action Plan

1. Adjust `computeUnlocks` ranking logic in `engine/src/differentiators/computeUnlocks.ts`.
2. Update `evaluatePreflight.ts` issue categorizations to explicitly tag administrative checks as `"General Guidance"`.
3. Update `data/TODO-verify.md` with all memory items.
4. Execute browser-based verification workflows across 30+ scheme candidates.
