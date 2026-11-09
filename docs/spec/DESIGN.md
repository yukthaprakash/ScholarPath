# DESIGN — ScholarPath

**Version 2.0 (Final) · 02 October 2026**

## 1. Direction: Clean, Minimal, With Essence
**Calm, editorial, trustworthy.** Few elements, strong hierarchy, generous whitespace, one idea per screen. Not a government portal, not a chatbot landing, not a gradient SaaS.

### Essence: "The Path"
A single thin vertical/horizontal line connects **Profile → Match → Gaps → Plan → Apply**. It appears as the logo mark, the landing hero, the onboarding progress, the scheme "receipt" spine, and the plan timeline. One motif everywhere = identity without decoration.

## 2. Principles
1. One primary action per screen.
2. Lists with dividers over card grids; cards only for the scheme summary and comparison.
3. Text first; icons only to aid scanning.
4. Colour for meaning only (status), never decoration.
5. Show the *why* on tap, keep the first view quiet.
6. Max content width 1080 px; 8-pt spacing grid.

## 3. Palette (reduced)
```text
Paper    #FAF8F4   (background)
Ink      #16202E   (text)
Muted    #6B7585   (secondary text)
Line     #E3E0D9   (dividers)
Green    #1F6B57   (primary / success)
Gold     #D9A441   (unlock / highlight only)
Amber    #B7791F   (warning text)   Red #B4443E (error / urgent)
Blue-tint #EAF0F8  (info / needs verification)
```
No gradients, no shadows beyond a 1 px line, radius 8 px.

## 4. Typography
Headings: Manrope (600/700). Body: Inter (400/500). Scale: 40 / 28 / 20 / 16 / 14 / 12. Eligibility-critical text ≥ 14 px, body 16 px. Support Kannada/Devanagari fallbacks (Noto Sans Kannada, Noto Sans Devanagari).

## 5. Status Language (colour + icon + word)
| State | Marker | Label |
|-------|--------|-------|
| Eligible | ● green ✓ | Potential match |
| Nearly eligible | ◐ amber | Nearly eligible |
| Not matched | ○ grey ✕ | Not matched |
| Needs verification | ◇ blue ? | Needs verification |
Urgency: "7 days left" with 🔴/🟠/🟢 **and** text.

## 6. Screens

### Landing
Hero: **Find the support you may be missing.** Sub: one sentence. Two actions: *Check my opportunities* (Quick Check), *See how it works*. Visual: the Path animating once (Profile → Match → Gaps → Plan → Apply). Below: 3 steps, "What makes it different" (4 USPs max), trust strip ("Official sources · Rules decide · AI explains"), footer disclaimer.

### Quick Check
One screen, six fields, instant count and top 3 results; CTA to save and unlock the full plan.

### Onboarding
One group per step; large inputs; "Why we ask this" in muted text; progress as the Path line; Back / Continue. Resume banner if incomplete.

### Home
Top: **Next best action** (single sentence + button), e.g. "Start your income certificate by 10 Oct — it unlocks 3 schemes."
Then a quiet row of four numbers (Potential · Nearly · Unlock · Days to next deadline). Then results as a list: name, authority, status marker, one-line reason, trust badge, deadline. Filters in a collapsed bar.

### Scheme Page (the Receipt)
Spine = the Path line down the left:
1. Summary (benefit, authority, deadline, trust badge)
2. **Why** — rule list with ✓ ○ ? (tap for clause/source/version)
3. **Gap** — distance and next-year forecast (only if relevant)
4. **Pre-flight** — 4–8 yes/no checks
5. **Documents** — readiness, issuer, where to get
6. **Plan** — start-by dates
7. **Conflicts** — with other saved schemes
8. **Official** — apply button, source links, disclaimer
AI explainer: a collapsed "Explain in simple words" row, labelled *AI explanation*.

### Compare
Table with 2–3 columns; sticky header; mobile becomes stacked sections.

### Plan
Timeline grouped Today / This week / Later, each item with the scheme(s) it serves and a done toggle.

### Applications
Stage stepper per application, days in stage, "What if stuck?" with copyable message.

### Passport
Document list: type, issuer, issued, valid until, "serves N schemes", expiry marker.

## 7. Motion
Only: Path draw-in on landing, stage change tick, save confirmation. 150–250 ms ease-out. Respect `prefers-reduced-motion`.

## 8. Mobile First
Bottom nav: Home · Explore · Plan · Saved · Profile. Single column; tap targets ≥ 44 px; compare becomes stacked; print stylesheet for the Kit.

## 9. Empty / Error / Loading
- Empty: "No verified match yet. Add your course or income to see more."
- Error: plain language + retry; Demo Mode banner when offline.
- Loading: skeleton lines, never spinners over content.

## 10. Trust UI Components
`TrustBadge` (High/Med/Low + reasons on tap) · `SourceChip` (T1/T2 + link) · `ExplanationLabel` (Verified / Preliminary / AI) · `Disclaimer` (single line, always present on results).

## 11. Component List (keep small)
Button, Input, Select, Toggle, Tabs, Badge, Row, SchemeRow, ReceiptRule, GapBar, PathSpine, PlanItem, StageStepper, Banner, Sheet. Reuse; avoid new variants.
