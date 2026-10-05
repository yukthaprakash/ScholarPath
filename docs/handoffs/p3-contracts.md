# Person 3 Public API Contracts & Export Specifications

This document catalogs every public export from `engine/src/index.ts` and `ai/src` along with exact TypeScript signatures and concise function descriptions.

---

## 1. Engine Public Exports (`engine/src/index.ts`)

### Domain Types & Schemas
- **`StudentProfile`**: Complete data structure representing a student's academic, personal, demographic, financial, certificate, and document readiness fields.
- **`Scheme`**: Data structure representing a scholarship/welfare scheme, its offering authority, financial benefits, application window, citations, required certificates, and rule set.
- **`Rule`**: Definition of a single eligibility criteria rule with operator, target field key, expected value, actionability, and clause reference.
- **`RuleTrace`**: Detailed trace of a rule evaluation containing student value, expected value, outcome (`PASS` | `FAIL` | `UNKNOWN`), distance calculation, and clause reference.
- **`SchemeMatch`**: Detailed scheme evaluation outcome including match state (`ELIGIBLE` | `NEARLY_ELIGIBLE` | `NEEDS_VERIFICATION` | `NOT_MATCHED`), rule traces, missing actionable rules, and trust score.
- **`AnalyzeResult`**: Summary payload returned by `analyzeAll` containing timestamp, student ID, matches array, and count summaries.
- **`UnlockResult`**: Payload returned by `computeUnlocks` listing actionable steps ranked by number of schemes unlocked.
- **`ForecastResult`**: 1-year academic and age progression simulation outcome detailing newly eligible and lost schemes.
- **`StackResult`**: Optimal combination of non-conflicting schemes maximizing financial benefit.
- **`BackwardsPlan`**: Critical-path timeline working back from scheme application deadline to document procurement start dates.
- **`PreflightResult`**: Document readiness check flagging critical rejection risks and general administrative guidance.
- **`TrustScore`**: Source citation trust level (`HIGH` | `MEDIUM` | `LOW`), freshness in days, and tier score.
- **`HouseholdProfile`**: Combined multi-student household data structure.
- **`profileSchema`**: Zod schema validating a `StudentProfile` object.
- **`schemeSchema`**: Zod schema validating a `Scheme` object.

### Public API Functions

#### `validateScheme(data: any): { success: boolean; data?: Scheme; errors?: string[] }`
Validates an untyped JSON object against `schemeSchema` and returns typed data or array of error strings.

#### `evaluateRule(profile: StudentProfile, rule: Rule, today: string): RuleTrace`
Evaluates a single rule against a student profile using an injected `today` clock and computes numeric or date distance.

#### `distance(studentValue: any, rule: Rule): RuleTrace['distance']`
Calculates distance metrics (difference, units, descriptive message) between a student value and a rule threshold.

#### `matchScheme(profile: StudentProfile, scheme: Scheme, today: string): SchemeMatch`
Evaluates all rules for a scheme against a profile and determines match state per the 4-level hierarchy.

#### `quickCheck(profile: StudentProfile, scheme: Scheme, today: string): { state: SchemeMatchState; isEligibleOrNearly: boolean; financialBenefit: number }`
Performs a fast-pass eligibility check returning match state, eligibility boolean, and financial benefit.

#### `analyzeAll(profile: StudentProfile, schemes: Scheme[], options?: AnalyzeAllOptions): AnalyzeResult`
Batch evaluates a student profile against an array of schemes and returns categorized summaries and total financial opportunity.

#### `computeUnlocks(profile: StudentProfile, schemes: Scheme[], today?: string): UnlockResult`
Simulates fulfilling missing actionable rules and ranks actions primarily by number of schemes unlocked.

#### `forecast(profile: StudentProfile, schemes: Scheme[], targetYears?: number, today?: string): ForecastResult`
Projects student profile age and academic year 1 year into the future and lists newly eligible and lost schemes.

#### `pairConflict(schemeA: Scheme, schemeB: Scheme, customConflicts?: ConflictPair[]): { hasConflict: boolean; conflictReason?: string }`
Evaluates whether two schemes have an exclusion conflict based on government policy or custom exclusion graphs.

#### `bestStack(eligibleMatches: SchemeMatch[], allSchemesMap: Map<string, Scheme>, conflictsGraph?: ConflictPair[]): StackResult`
Selects the optimal non-conflicting subset of eligible schemes maximizing financial value.

#### `planBackwards(scheme: Scheme, today?: string): BackwardsPlan | null`
Calculates step-by-step document procurement start dates working backwards from a scheme's application deadline.

#### `evaluatePreflight(profile: StudentProfile, scheme: Scheme): PreflightResult`
Audits document readiness, name/DOB consistency, bank DBT seeding, and institute registration, tagging items as critical or general guidance.

#### `trustLevel(scheme: Scheme, today?: string): TrustScore`
Calculates citation freshness in days, source tier, and trust banner message for a scheme.

#### `mergeHousehold(primaryStudent: StudentProfile, dependents?: StudentProfile[]): HouseholdProfile`
Aggregates household income and dependent student profiles for multi-student household planning.

---

## 2. AI Layer Public Exports (`ai/src`)

#### `buildSystemPrompt(language?: 'en' | 'kn' | 'hi'): string`
Builds a concise system prompt under 120 words instructing the LLM to answer strictly from supplied JSON context.

#### `buildUserContext(profile: Partial<StudentProfile>, match: SchemeMatch): string`
Formats verified student profile and scheme match trace into a bounded JSON string.

#### `checkAnswerGuard(responseText: string, contextJsonString: string): { isValid: boolean; reason?: string }`
Audits LLM output to ensure zero ungrounded URLs, dates, numbers, or false approval claims exist.

#### `getDeterministicFallback(match: SchemeMatch): string`
Provides a clean, template-based deterministic summary of match state when AI is disabled, times out, or fails guard check.

#### `explainMatchWithAI(profile: Partial<StudentProfile>, match: SchemeMatch, options?: ExplainMatchOptions): Promise<{ text: string; isFallback: boolean; reason?: string }>`
Server-side call to Gemini API with an 8-second timeout, automatically falling back to deterministic output if timed out or rejected by answer guard.
