# ScholarPath Verified Scheme Data Layer

This directory holds the authoritative, citation-backed scheme catalog, source snapshots, procurement guides, and demo profile fixtures for the ScholarPath platform.

## Directory Layout
```text
data/
├── schemes/           # Authoritative scheme JSON definitions (one per scheme)
├── sources/           # Official source metadata, portal citations, and verification hashes
├── guides/            # Step-by-step certificate procurement guides (6 common certificates)
├── seed/              # Reference demo student profile
├── fixtures/          # Sample deterministic engine analysis output
├── conflicts.json     # Inter-scheme exclusion graph
├── CANDIDATES.md      # Master roadmap of 30+ scheme targets
├── REVIEW.md          # Multi-engineer sign-off register
├── TODO-verify.md     # Ongoing verification audit log
└── README.md          # Data layer documentation
```

## Quality Invariants
1. **Tier 1 / Tier 2 Citations:** Every scheme cites an official government or statutory authority page with clause reference and read-on date.
2. **Zero Fabrication:** Unverified values are explicitly omitted or marked UNKNOWN.
3. **Two-Person Rule:** All schemes remain `isDemo: true` until an independent engineer signs off in `REVIEW.md`.
4. **Golden Test Coverage:** Every scheme in `schemes/` is matched with an automated 3-profile golden test in `tests/golden/<slug>.golden.test.ts`.
