# MEMORY — ScholarPath (context for AI coding assistants)

**Version 2.0 (Final) · 02 October 2026 · AY 2026–27**

## Product
Project 46: Scholarship & Government Scheme Eligibility Checker. Web tool matching students to eligible scholarships and welfare schemes from entered criteria. 30 hours, 3 people. Name: ScholarPath. Positioning: from eligibility to action.

## What makes it different (14 USPs, `USP_BRIEF.md`)
Eligibility Receipt · Unlock Engine · Distance & Next-Year Forecast · Pre-Flight Rejection Check · Benefit Conflict Resolver · Certificate Passport · Critical-Path Planner · Change Radar · Verification Tracker · Household Mode · Last-Mile Kit · Data Trust Score · Renewal Radar · Open Rules API.
Tier A (demo): 1, 2, 3, 4, 7, 12. Tier B: 5, 6, 9, 11. Tier C: 8, 10, 13, 14.

## Architecture principle
Rules decide → AI explains → Authority approves. States: ELIGIBLE · NEARLY_ELIGIBLE · NOT_MATCHED · NEEDS_VERIFICATION. Data is versioned, cited, and quality-gated (`DATA_STRATEGY.md`).

## Team
P1 frontend (`frontend/`) · P2 backend + data platform (`backend/`) · P3 engine + data content + AI (`engine/`, `data/`, `ai/`). Don't move work between people without being asked.

## Design memory
Minimal, editorial, one primary action per screen, The Path motif, lists over cards, colour only for status, no gradients/glass/blobs, tiny palette (Paper #FAF8F4, Ink #16202E, Green #1F6B57, Gold #D9A441 for unlock only).

## Trust memory
Never invent schemes, rules, amounts, deadlines, durations, links. T3 sources are leads only. Unknown → "Needs verification". No unexplained percentage. Trust score = data quality, never eligibility. Don't claim absolute "firsts": say "to our knowledge".

## Coding memory
Inspect first; reuse components; small PRs; tests after engine changes; golden tests updated with rule changes; no secrets in git; frontend works with AI off and backend off (Demo Mode); terminal commands for Git Bash on Windows; dates stored ISO, shown DD MMM YYYY, "days left" computed from the device date.

## Demo memory
Profile yields ≥6 matches, ≥3 nearly, ≥2 unlock actions, ≥1 forecast, ≥1 pre-flight issue, ≥1 conflict. Journey: Quick Check → Why (source) → Gap/Unlock → Pre-flight → Plan → Official application.

## Instruction to AI assistants
Inspect the codebase; follow all spec files; keep changes small and tested; never present demo data as official.
