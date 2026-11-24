# IMPLEMENTATION PLAN — ScholarPath

**Version 2.0 (Final) · 02 October 2026 · AY 2026–27 · 30 hours · 3 people**
Terminal commands are for **Git Bash** on Windows.

## 0. Strategy
1. **Vertical slice by H12:** wizard → engine → Home → Scheme Receipt → official link.
2. **Data and engine are the product.** UI is minimal by design; invest in correctness.
3. **Tiering:** Tier A USPs are in the demo; Tier B if on schedule; Tier C are schema + one seeded example + roadmap slide.
4. **Demo Mode is a feature:** the frontend runs the same engine on bundled JSON.
5. **Freeze at H28.**

### Tier Plan
| Tier | USPs | Build cost |
|------|------|-----------|
| A | 1 Receipt · 2 Unlock · 3 Distance/Forecast · 4 Pre-flight · 7 Planner · 12 Trust | engine + UI |
| B | 5 Conflicts · 6 Passport · 9 Tracker · 11 Last-Mile Kit | API + UI |
| C | 8 Radar · 10 Household · 13 Renewal · 14 Open API | schema + stubs + seeded demo |

### Cut List (in order)
1. Voice input, document-type detection, NL search
2. Tier C UIs (keep schema)
3. Kannada/Hindi UI beyond top screens
4. AI explainer (keep static labels)
5. Real Google auth (keep Demo Mode)
Never cut: wizard, engine, Receipt, Nearly Eligible, Unlock, Pre-flight, Planner, Trust badge, official links, disclaimers.

## 1. Decisions at H0
| Item | Choice |
|------|--------|
| Engine | TypeScript, pure functions, shared by frontend and backend |
| Backend | Node + Express + Zod |
| DB | PostgreSQL (Supabase); local dev may use SQLite for speed |
| Search | Postgres full-text (`tsvector`) |
| Auth | Firebase Google + Demo Mode |
| Languages | EN first, KN/HI strings for top screens |
| Date reference | Use device date; demo can pin a "today" via env for stable screenshots |

## 2. Setup (H0–1) — P2 leads
```bash
mkdir scholarpath && cd scholarpath
git init -b main
npm init -y && npm pkg set private=true
npm pkg set workspaces='["frontend","backend","engine"]' --json
npm create vite@latest frontend -- --template react-ts
mkdir -p backend/src engine/src ai data/{schemes,sources,guides,seed,fixtures} tests/golden docs
(cd frontend && npm i && npm i react-router-dom framer-motion lucide-react react-i18next i18next vite-plugin-pwa && npm i -D tailwindcss @tailwindcss/vite)
printf "node_modules\n.env\n.env.*\n!.env.example\ndist\n*.log\n" > .gitignore
git add . && git commit -m "chore: scaffold monorepo and spec docs"
git remote add origin <repo-url> && git push -u origin main
```
Teammates: `git clone <repo-url> && cd scholarpath && git checkout -b p1/design-system`.

`.env.example`
```text
DATABASE_URL=postgres://user:password@localhost:5432/scholarpath
FIREBASE_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-key-here
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
VITE_DEMO_MODE=true
```

## 3. Phases

### Phase 1 — Contracts + Data Model (H0–4)
All three, 60 minutes: `engine/src/types.ts`, profile fields, result shape (`ARCHITECTURE.md §5`), schema draft, `data/fixtures/analyze-result.sample.json` by H3 (P3).
P3 begins data collection immediately (`DATA_STRATEGY.md`); first 10 schemes by H6.

### Phase 2 — Parallel Build A (H1–9)
| P1 | P2 | P3 |
|----|----|----|
| H1–3 tokens + components | H1–4 schema, migrations, loader | H1–4 types, rule schema |
| H3–7 Wizard + Quick Check | H3–5 Auth + Demo | H4–9 evaluate, match, readiness |
| H7–9 Landing + Path motif | H5–9 profile, schemes (search), health, CI | H6–9 golden tests, 10→20 schemes |
Exit H9: engine v1 passes tests; wizard complete; DB seeded; CI runs `data:check`.

### Phase 3 — Integration Checkpoint 1 (H9–12)
`/eligibility/analyze` wired; Home on real results; fix contract mismatches. Slice demo works.

### Phase 4 — Parallel Build B: USPs (H9–18)
| P1 | P2 | P3 |
|----|----|----|
| Home next-best-action, SchemeRow | `/plan`, `/compare`, `/conflicts` | `unlock`, `forecast`, `planner` |
| Scheme Receipt (USP 1), Gap (USP 3) | `/preflight`, `/documents` | pre-flight data, `trust.ts` |
| Unlock, Pre-flight, Trust UI | `/applications`, `/radar`, jobs | conflicts data + best-stack, AI explainer |
Exit H18: all Tier A working on demo profile; Tier B APIs ready.

### Phase 5 — Integration Checkpoint 2 (H18–21)
Live API with Demo fallback verified; staging deploy; P3 data QA begins; Tier B UIs (Tracker, Passport, Conflicts, Kit) start.

### Phase 6 — Polish (H21–25)
Mobile pass, i18n top screens, print Kit, PWA offline check, empty/error/loading states, Tier C seeded examples (Radar event, Household, Renewal, Open API docs), demo profile tuning.

### Phase 7 — Testing (H25–28)
| Area | Owner | Check |
|------|-------|-------|
| Engine + golden | P3 | all pass; boundary cases (income = limit, missing fields) |
| Data | P3 + P2 | `npm run data:check`; every link opens; freshness |
| API | P2 | all endpoints with demo profile; authZ |
| UI | P1 | full journey on 390 px and 1440 px; keyboard-only |
| AI | P3 | out-of-context refusal; "change my result" refusal |
| Security | P2 | no tracked `.env`; no secrets in bundle |

Secrets check (Git Bash):
```bash
git ls-files | grep -E "(^|/)\.env($|\.)" | grep -v "\.env\.example" && echo "PROBLEM: env tracked" || echo "ok"
git grep -nEi "(api[_-]?key|secret|password)[[:space:]]*[:=][[:space:]]*['\"][A-Za-z0-9_-]{12,}" -- . ':!*.md' || echo "no obvious secrets"
```

### Phase 8 — Demo (H28–30)
Freeze, seed final demo profile, rehearse 3-minute demo twice, record fallback video, verify deployed URLs and Demo Mode with backend off.

## 4. Key Algorithms

**Unlock**
```ts
const base = matchAll(schemes, profile);
const actions = uniqueActionableMissing(base);
return actions.map(a => {
  const after = matchAll(schemes, apply(profile, a));
  const newly = diffToEligible(base, after);
  return { action: a.label, schemes: newly.map(s => s.id), count: newly.length };
}).filter(x => x.count).sort((a, b) => b.count - a.count);
```

**Forecast** — `progress(profile)`: yearOfStudy+1 (cap by course length), age+1, level change at course end; income, category, state unchanged unless user sets; run `matchAll`; list assumptions.

**Distance** — numeric: `gap = value - limit` (income) or `limit - value` (marks); express as amount and percent of limit; date rules: days.

**Planner**
```ts
function planBackwards(deadline, tasks) {   // tasks: {id, durationMax, dependsOn[]}
  // start-by = deadline - criticalPathLength(task) - safetyBuffer(2 days)
  // order by earliest start-by; flag if start-by < today
}
```
Unknown durations → `startBy = null`, label "ask the issuing office".

**Best Stack** — enumerate subsets of ≤ 12 candidate schemes (2^12 = 4096), drop subsets containing INCOMPATIBLE pairs, penalize REQUIRES_VERIFICATION, maximize summed `potentialValue` where published; if no amounts are published, maximize count and say so.

**Trust** — see `DATA_STRATEGY.md §8`.

## 5. Demo Script (3 minutes)
1. 0:00 Problem: "Portals say *maybe*. We say *why*, *what's missing*, and *start by when*."
2. 0:20 Quick Check → count → sign in (Demo).
3. 0:40 Home: next best action ("start income certificate by 10 Oct").
4. 1:00 Scheme: Receipt, tap ✓ → clause + source; Trust badge.
5. 1:30 Gap on a Not matched scheme; Unlock ranking.
6. 2:00 Pre-flight catches a documented issuer error.
7. 2:20 Compare + conflict; Plan timeline.
8. 2:40 Kannada toggle, print Kit, offline.
9. 2:55 Close: rules decide, AI explains, authority approves.

### Slide Outline (5 min)
Problem · Landscape and gap · 14 USPs (Tier A highlighted) · Architecture (rules vs AI vs authority) · Data pipeline (tiers, two-person verification, golden tests) · Live demo · Roadmap (Tier C, more states, institutes dashboard).

## 6. Risks
| Risk | Mitigation |
|------|-----------|
| Data inaccuracy | T1/T2 sources, two-person review, `data:check`, golden tests |
| Scope (14 USPs) | Tiering and cut list |
| Contract drift | Types file, fixtures, checkpoints H12/H21 |
| Auth time sink | Demo Mode from day 1 |
| AI hallucination | Grounding, fallback, tests |
| Late deploy issues | Deploy skeleton at H5 |
| Stale deadline info (NSP 2026–27 dates from secondary sources) | Verify on official portal; show verifiedAt; "needs verification" |
| Overclaiming "first/unique" | Use "to our knowledge"; re-check landscape before presenting |

## 7. Post-Hackathon Roadmap
More states by data only · institute nodal-officer dashboard · DigiLocker-based document import (consent-based) · SMS/WhatsApp reminders · rule-authoring admin UI with audit trail · partnerships for verified data feeds.
