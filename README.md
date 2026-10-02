
# ScholarPath — From Eligibility to Action

**Version 2.0 (Final) · Updated 02 October 2026 · Academic Year 2026–27**
**Project 46: Scholarship & Government Scheme Eligibility Checker**

> Official problem statement: *Develop a web tool matching students to eligible scholarships and welfare schemes based on entered criteria.*
> Scope: 30-hour community project · Team of 3

**Tagline:** Find what you qualify for. Know what you're missing. Take the next step.

---

## 1. One-Paragraph Pitch
Today's portals tell a student *whether* a scheme might apply. ScholarPath tells them **why** (with the exact rule and its official source), **what is missing**, **how far they are from qualifying**, **what one action unlocks the most schemes**, **which mistakes get applications rejected**, and **by which date each document must be started** to meet the deadline. It is a deterministic, citation-backed eligibility engine with an AI explanation layer on top, not a scheme directory.

## 2. Why Now (context at 02 Oct 2026)
- The National Scholarship Portal (NSP) 2026–27 cycle is open; most listed sources show **31 October 2026** as the last date for most schemes (secondary sources — always verify on scholarships.gov.in). With under a month left, *time-to-deadline planning* matters more than discovery.
- myScheme (Govt. of India) now lists 5,000+ schemes across categories. Discovery is largely solved; **preparation, rejection avoidance, stacking, and tracking are not**.
- Common rejection causes documented across guides: income certificate from the wrong authority, name/DOB mismatch across documents, expired or wrong-year certificates, Aadhaar–bank seeding, institute not registered, overlapping scholarships.

## 3. Feature Set

### 3.1 Core features required by the problem statement
| # | Requirement | Feature |
|---|-------------|---------|
| R1 | Entered criteria | Multi-step profile wizard (Eligibility DNA) |
| R2 | Match students to eligible schemes | Deterministic rule engine → Eligible / Nearly / Not matched / Needs verification |
| R3 | Scholarships **and** welfare schemes | Unified catalogue with `type`: scholarship · fellowship · fee waiver · hostel/stipend · welfare · loan subsidy |
| R4 | Understand results | Explainable match (Eligibility Receipt) |
| R5 | Browse / search / filter | Search, filters (type, level, state, authority, deadline), sort |
| R6 | Scheme information | Detail page: benefits, rules, documents, deadline, official links |
| R7 | Save / compare | Save list, side-by-side compare (2–3 schemes) |
| R8 | Act | Official application link, action plan, tracker |
| R9 | Accessibility & reach | Responsive, multilingual (EN/KN/HI), voice input (stretch) |

### 3.2 Differentiators — 14 USPs (details in `USP_BRIEF.md`)
1. **Eligibility Receipt** — clause-level proof with source and rule version
2. **Unlock Engine** — what-if simulation: one action → N schemes
3. **Distance-to-Eligibility & Next-Year Forecast** — "₹18,000 above the limit" / "eligible next semester"
4. **Pre-Flight Rejection Check** — catches documented rejection causes before you apply
5. **Benefit Conflict Resolver** — best non-overlapping combination of schemes
6. **Certificate Passport** — one document → every scheme it serves, with validity tracking
7. **Critical-Path Deadline Planner** — "start your income certificate by 10 Oct"
8. **Scheme Change Radar** — rule/deadline changes, with who is affected
9. **Verification-Stage Tracker** — institute → district/state stages with nudges and escalation templates
10. **Household Mode** — siblings and parents in one plan
11. **Last-Mile Kit** — printable checklist, offline PWA, helper hand-off, how-to-get-it guides
12. **Data Trust Score** — freshness, source tier, rule coverage (not an eligibility score)
13. **Renewal Radar** — year-over-year renewal requirements
14. **Open Rules API** — machine-readable, versioned, citation-linked scheme rules

## 4. Trust Principle
| Layer | Responsibility |
|-------|----------------|
| Rule engine (deterministic) | Decides whether published criteria match |
| AI | Explains, summarizes, translates — never decides |
| Official authority | Final decision |

Mandatory notice: *Preliminary assessment based on published criteria. Final eligibility is determined by the respective authority.*

## 5. Document Map
| File | Purpose |
|------|---------|
| `README.md` | Overview (this file) |
| `USP_BRIEF.md` | The 14 differentiators with mechanics, tiers, demo moments |
| `PRD.md` | Requirements, flows, acceptance criteria, PS traceability |
| `ARCHITECTURE.md` | System design, DB schema, API, algorithms |
| `DATA_STRATEGY.md` | Scheme data sourcing, verification workflow, quality gates |
| `RULES.md` | Non-negotiable engineering and trust rules |
| `DESIGN.md` | Minimal visual and UX system |
| `TEAM_ROLES.md` | Three roles in detail |
| `IMPLEMENTATION_PLAN.md` | Hour-by-hour build plan |
| `TASK.md` | Checklist |
| `MEMORY.md` | Context for AI coding assistants |
| `MASTER_PROMPT.md` | Master prompt for AI builders |

## 6. Stack
Frontend: React + Vite + TypeScript, Tailwind, Framer Motion (light), Lucide, PWA plugin · Backend: Node/Express + Zod (shared TS engine) · DB: PostgreSQL (Supabase) with full-text search · Auth: Firebase Google + Demo Mode · AI: Gemini API (server-side) · Deploy: Vercel + Render/Railway.

## 7. Repository Layout
```text
scholarpath/
├── *.md                      # spec files
├── frontend/                 # React app (+ PWA, i18n)
├── backend/                  # API, services, cron jobs
├── engine/                   # pure TS: rules, unlock, forecast, conflicts, planner, tests
├── ai/                       # prompts, grounding, fallbacks
├── data/
│   ├── schemes/              # one JSON per scheme (source of truth)
│   ├── sources/              # source snapshots + hashes
│   ├── guides/               # certificate procurement guides
│   ├── conflicts.json        # benefit exclusion graph
│   ├── seed/                 # demo profiles
│   └── fixtures/             # sample API outputs
└── tests/
```

## 8. Security & Privacy
No secrets in git. Store certificate **metadata only** (type, issuer, issue date, validity year), never raw uploads, in the MVP. Collect only fields schemes use. Demo with fictional profiles.

## 9. Disclaimer
Informational matching and preparation tool. A match does not guarantee eligibility, sanction, payment, or approval.
