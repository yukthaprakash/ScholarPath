# RULES — ScholarPath

**Version 2.0 (Final) · 02 October 2026**

1. **AI never decides eligibility.** The engine does. AI explains, translates, summarizes.
2. **Source rule.** Every rule has a T1/T2 `sourceRef`. T3 sources are leads only.
3. **No invention.** Never invent schemes, rules, amounts, deadlines, durations, URLs. Unknown → `UNKNOWN` / "varies, verify".
4. **States.** ELIGIBLE · NEARLY_ELIGIBLE · NOT_MATCHED · NEEDS_VERIFICATION (derivation in `ARCHITECTURE.md §5`).
5. **Explainability.** Every result shows rule trace, matched/missing/unknown, next step, source. No unexplained percentage anywhere.
6. **Nearly Eligible.** Only when no fixed mandatory rule fails and an actionable one is unresolved.
7. **Unlock.** Only for documented criteria; copy: "may make additional schemes relevant; final eligibility is determined by the authority."
8. **Distance & forecast.** Show assumptions explicitly (e.g. "assumes year of study +1; income unchanged"). Never present a forecast as a promise.
9. **Pre-flight.** Each check cites a source. Answers "Unsure" produce "Verify", never "OK".
10. **Conflicts.** COMPATIBLE only with official support; default REQUIRES_VERIFICATION. Amounts labelled "potential".
11. **Deadlines.** Date + source + verifiedAt. Stale → "Deadline needs verification".
12. **Planner.** Use the conservative (max) duration; unknown durations are shown as unknown, not guessed.
13. **Trust score.** Describes data quality only. It must not affect an eligibility outcome, only add a banner.
14. **AI limits.** May not invent criteria, benefits, deadlines, links; may not change results; must say "not in verified data" when needed; core works with AI off.
15. **Privacy.** Collect only fields schemes use; certificate **metadata only**; no raw uploads in MVP; no PII in logs; demo data fictional; share tokens scoped and expiring.
16. **UX trust labels.** Always distinguish: Verified fact · System interpretation · AI explanation · Official decision.
17. **Failure behaviour.** Missing data → "We need one more detail"; backend down → Demo Mode banner; never fabricate API output.
18. **Accessibility.** Keyboard, focus, labels, contrast, semantic HTML, no colour-only meaning, reduced motion, 390 px support.
19. **Engineering.** Inspect before changing; small PRs; contracts in `types/`; engine changes need tests + golden updates; no secrets in git; `.env.example` only; terminal commands for Git Bash.
20. **Dates.** All displayed dates use ISO storage and local display (DD MMM YYYY); relative text ("29 days left") is computed from the device date and the stored deadline.
