# Person 3 Demo Student Tuning & Verification Report

**Date:** 2026-11-09  
**Reference Student Profile:** `data/seed/demo-student.json` (`demo-student-yuktha-01`)  
**Catalog Size:** 13 verified schemes

---

## 1. Demo Student Target Metrics Verification

| Metric | Target | Actual Value | Status | Evidence / Schemes Involved |
|--------|--------|--------------|--------|-----------------------------|
| **Total Matches** (Eligible + Nearly) | ≥ 6 | **6** | PASSED | `karnataka-ssp-post-matric`, `karnataka-epass-fee-concession` (Eligible); `nsp-central-sector-ug`, `nsp-post-matric-obc`, `karnataka-vidyasiri-hostel`, `aicte-pragati-degree` (Nearly Eligible) |
| **Nearly Eligible** | ≥ 3 | **4** | PASSED | 4 schemes missing actionable certificates (`INCOME_CERTIFICATE`, `BONAFIDE_CERTIFICATE`) |
| **Missed Opportunities** (Not Matched) | Plentiful | **7** | PASSED | Schemes outside criteria: `aicte-saksham-degree` (PwD), `nsp-post-matric-sc` (SC), `nsp-post-matric-st` (ST), `ugc-ishan-uday-ner` (NER), `nsp-nmmss` (Class 9-10), `ugc-single-girl-child-pg` (PG), `karnataka-pratibha-puraskar` (Year 3+) |
| **Unlock Actions** | ≥ 2 | **2** | PASSED | Action 1: Obtain `INCOME_CERTIFICATE` (unlocks 3 schemes); Action 2: Obtain `BONAFIDE_CERTIFICATE` (unlocks 1 scheme) |
| **Next-Year Forecast Changes** | ≥ 1 | **1** | PASSED | `karnataka-pratibha-puraskar` requires Year 3+ UG; moves from NOT_MATCHED to ELIGIBLE in Year 1 forecast |
| **Pre-Flight Issues** | ≥ 1 | **3** | PASSED | Unsure current-year income validity; missing income cert; missing bonafide cert |
| **Benefit Conflicts** | ≥ 1 | **2** | PASSED | Central sector scholarship exclusivity & SSP / Vidyasiri concurrent accommodation restrictions |

---

## 2. Student Profile Journey Narrative
1. **Quick Check**: 6-field initial check surfaces immediate potential matches in Karnataka state and central sectors.
2. **Eligibility Receipt**: Clause-level trace shows exact passing rules (OBC, Karnataka domicile, 82.5% score).
3. **Unlock Engine**: Suggests obtaining Income Certificate and College Bonafide Certificate to unlock 4 additional schemes worth up to ₹87,000.
4. **Pre-Flight Rejection Check**: Flags unverified income certificate year before submission to prevent portal rejection.
5. **Critical Path Planner**: Generates backward timeline working backwards from the 31 October 2026 deadline.
