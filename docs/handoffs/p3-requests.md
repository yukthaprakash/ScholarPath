# Person 3 (Eligibility Engine + Data + AI Lead) — Handoffs & API Contracts

## To Person 1 (Frontend Lead) & Person 2 (Backend Lead)

### 1. Engine Entrypoint & Package Import
Import directly from `@scholarpath/engine` or `engine/src/index.ts`:

```typescript
import {
  StudentProfile,
  Scheme,
  SchemeMatch,
  AnalyzeResult,
  validateScheme,
  quickCheck,
  matchScheme,
  analyzeAll,
  computeUnlocks,
  forecast,
  bestStack,
  planBackwards,
  evaluatePreflight,
  trustLevel,
  mergeHousehold
} from './engine/src/index.js';
```

### 2. Standard State Logic Hierarchy
When rendering match badges or filtering:
- `ELIGIBLE`: All required actionable and non-actionable rules satisfied.
- `NEARLY_ELIGIBLE`: Required non-actionable rules pass, but 1+ required actionable rules are missing/unsatisfied.
- `NEEDS_VERIFICATION`: 1+ required non-actionable rules are `UNKNOWN` (missing profile field).
- `NOT_MATCHED`: 1+ required non-actionable rules explicitly failed.

### 3. AI Safety & Fallback Integration
Call `explainMatchWithAI(profile, match, { language: 'en' | 'kn' | 'hi' })` from `ai/src/geminiClient.ts`.
- Server-side call with an 8-second timeout.
- Includes automated `checkAnswerGuard` preventing hallucinated dates, URLs, numbers, or false approval claims. Returns `isFallback: true` with a deterministic template whenever guard checks flag a response.

### 4. Demo Student Seed Data Location
`data/seed/demo-student.json` contains the reference profile.
- Illustrative sample output available at `data/fixtures/analyze-result.sample.json`.

### 5. Verified Scheme Catalog Location
All verified scheme JSON files are stored in `data/schemes/<slug>.json`.
- Benefit exclusion graph available in `data/conflicts.json`.
- Certificate procurement guides stored in `data/guides/*.json`.
