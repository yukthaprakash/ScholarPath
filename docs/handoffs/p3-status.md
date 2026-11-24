# Person 3 (Eligibility Engine + Data + AI Lead) — Audit Status Report

**Generated:** 2026-11-09  
**Branch:** `p3/start`  
**Command Outputs:**
- `npm test`: 6 test files, 58 tests (56 passed, 2 failed: Golden Profile 2 in `nsp-post-matric-sc` and `nsp-post-matric-st`)
- `npm run type-check`: `tsc --noEmit --project engine/tsconfig.json` PASSED (0 errors)

---

## Audit Checklist Table

| ID | Item | Status | Evidence | Gap |
|----|------|--------|----------|-----|
| **C1** | `types.ts` completeness (ruleTrace, distance, forecast, readiness, preflight, trust, conflicts, plan) | PARTIAL | `engine/src/types.ts` defines all types, but `SchemeMatch` only embeds subset; differentiator structures are separate interfaces | Wire differentiator results into unified match/analyze models where expected |
| **C2** | Zod schemas (`profileSchema`, `schemeSchema`, etc.) | DONE | `engine/src/schema.ts` passes typecheck; validates student profile and schemes | Tighten date formats and require applicationUrl/lastVerified |
| **C3** | `validateScheme` rejects missing sources, tier 3, missing URLs, bad dates | PARTIAL | `validateScheme` in `engine/src/index.ts` uses `schemeSchema.safeParse` which restricts tier to 1 or 2 | Add explicit checks for missing URLs, lastVerified, and strict date formats |
| **C4** | `index.ts` exports all 16 public names | DONE | `engine/src/index.ts` lines 8-32 exports types, schemas, validateScheme, quickCheck, analyzeAll, matchScheme, computeUnlocks, forecast, distance, bestStack, pairConflict, planBackwards, evaluatePreflight, trustLevel, mergeHousehold | None |
| **C5** | Sample analyze-result fixture | DONE | `data/fixtures/analyze-result.sample.json` exists | None |
| **C6** | Demo student profile | DONE | `data/seed/demo-student.json` exists | Tune to achieve exact target counts |
| **C7** | Contracts documentation | DONE | `docs/handoffs/p3-contracts.md` exists | None |
| **R1** | Core 12 operators | DONE | `engine/src/core/evaluateRule.ts` supports all 12 operators; tested in `engine/tests/core.test.ts` | None |
| **R2** | Missing profile field yields UNKNOWN | DONE | `engine/src/core/evaluateRule.ts` returns `UNKNOWN` outcome on undefined/null values | None |
| **R3** | Numeric/date distance calculation | DONE | `calculateDistance` in `engine/src/core/evaluateRule.ts` tested in `core.test.ts` | None |
| **R4** | State order resolution (NOT_MATCHED -> NEEDS_VERIFICATION -> NEARLY_ELIGIBLE -> ELIGIBLE) | DONE | `engine/src/core/matchScheme.ts` lines 80-120 implements strict 4-state hierarchy | None |
| **R5** | 30+ core unit tests with boundaries | DONE | `engine/tests/core.test.ts` has 30 passing unit tests | None |
| **D1** | `computeUnlocks` ranking | DONE | `engine/src/differentiators/computeUnlocks.ts` ranks by schemes unlocked with financial tie-breaker | None |
| **D2** | `forecast` projection with assumptions | DONE | `engine/src/differentiators/forecast.ts` projects age and currentYear with listed assumptions | None |
| **D3** | `pairConflict` default REQUIRES_VERIFICATION | PARTIAL | `engine/src/differentiators/pairConflict.ts` checks conflicts graph | Default unmapped pairs to `REQUIRES_VERIFICATION` |
| **D4** | `bestStack` independent set optimization | DONE | `engine/src/differentiators/bestStack.ts` tested in `differentiators.test.ts` | None |
| **D5** | `planBackwards` backward scheduling | PARTIAL | `engine/src/differentiators/planBackwards.ts` exists | Add 2-day buffer, explicit null on missing deadline, and urgency buckets |
| **D6** | `evaluatePreflight` readiness & general guidance | PARTIAL | `engine/src/differentiators/evaluatePreflight.ts` exists | Ensure 'UNSURE' is never 'READY' and checks are tagged with sources/general guidance |
| **D7** | `trustLevel` freshness & coverage | DONE | `engine/src/differentiators/trustLevel.ts` evaluates 14/45 day windows and source tier | None |
| **D8** | `mergeHousehold` multi-student aggregation | DONE | `engine/src/differentiators/mergeHousehold.ts` merges incomes and dependents | None |
| **D9** | Differentiator unit tests (30+) | PARTIAL | `engine/tests/differentiators.test.ts` has 13 tests | Expand test coverage to 30+ tests |
| **DT1** | Scheme catalog volume (30+ verified schemes) | MISSING | Currently 6 schemes in `data/schemes/` | Add batches up to 30+ schemes with verified data |
| **DT2** | Scheme source snapshot records | PARTIAL | Only 4 snapshot files in `data/sources/` | Add snapshots corresponding to schemes |
| **DT3** | Data candidates & verification files | PARTIAL | `data/CANDIDATES.md`, `data/TODO-verify.md` exist; `data/REVIEW.md`, `data/README.md` missing | Add `data/REVIEW.md` and `data/README.md` |
| **DT4** | Procurement guides for 6 certificate types | PARTIAL | Only `data/guides/income-certificate.json` exists | Add caste, domicile, bonafide, disability, bank/Aadhaar seeding guides |
| **DT5** | Benefit conflicts graph | DONE | `data/conflicts.json` contains sourced conflict pairs | Expand with any new scheme conflicts |
| **DT6** | Golden tests with 3+ profiles per scheme | PARTIAL | 3 files exist in `tests/golden/`, 2 failing | Fix failing golden tests; add golden tests for all schemes |
| **AI1** | Grounded system prompt & user context builder | DONE | `ai/src/promptBuilder.ts` generates bounded context | None |
| **AI2** | Answer guard against hallucinated URLs/dates/claims | DONE | `ai/src/answerGuard.ts` audits outputs | None |
| **AI3** | Fallback and timeout handling | DONE | `ai/src/fallback.ts` and `ai/src/geminiClient.ts` implement 8s timeout | None |
| **AI4** | Adversarial AI test suite (6+) | DONE | `ai/tests/adversarial.test.ts` (6 tests passing) | None |
| **QA1** | Demo student target metrics | PARTIAL | `data/seed/demo-student.json` exists | Tune against full catalog to meet exact counts |
| **QA2** | Property-based tests (fast-check) | MISSING | Not yet implemented | Implement `engine/tests/property.test.ts` using `fast-check` |
| **QA3** | Performance benchmark (<50ms) | MISSING | Not yet implemented | Implement `engine/tests/benchmark.test.ts` |
| **QA4** | Data check script (`engine/scripts/data-check.ts` with `--links`) | MISSING | Not yet implemented | Create data validation script |
| **QA5** | Final report summary (`docs/handoffs/p3-final.md`) | MISSING | Not yet created | Generate upon completion of Stage B |

---

## Group Counts Summary (Before)

| Group | DONE | PARTIAL | MISSING | UNVERIFIED |
|---|---|---|---|---|
| **Contracts** | 5 | 2 | 0 | 0 |
| **Core** | 4 | 1 | 0 | 0 |
| **Differentiators** | 5 | 4 | 0 | 0 |
| **Data** | 1 | 4 | 1 | 0 |
| **AI** | 4 | 0 | 0 | 0 |
| **QA** | 0 | 1 | 4 | 0 |
| **Repo/Env** | 1 | 1 | 0 | 0 |

---

## Immediate Next Steps (Stage B)
1. **Fix Golden Test Failures & Audit Gaps**:
   - Fix `nsp-post-matric-sc.json` and `nsp-post-matric-st.json` by adding the actionable certificate rule so `nearMissProfile` correctly lands on `NEARLY_ELIGIBLE`.
   - Update `pairConflict`, `planBackwards`, and `evaluatePreflight` to meet exact spec requirements.
   - Expand `engine/tests/differentiators.test.ts` to 30+ tests.
2. **Verify & Expand Scheme Data (Batches of 5)**:
   - Re-verify existing schemes against official portals (NSP, SSP, AICTE, UGC).
   - Add new verified schemes up to target volume with corresponding source snapshots and golden tests.
   - Author the 5 remaining certificate guides (caste, domicile, bonafide, disability, Aadhaar/bank DBT).
3. **QA Sweep**:
   - Implement property-based tests (`fast-check`), performance benchmarks (<50ms), and `engine/scripts/data-check.ts`.
   - Tune `demo-student.json` to hit exact target metrics.

