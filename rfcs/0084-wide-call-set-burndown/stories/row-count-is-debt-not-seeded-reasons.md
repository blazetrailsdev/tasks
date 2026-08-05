---
title: "row-count-is-debt-not-seeded-reasons"
status: done
updated: 2026-08-05
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 6115
claim: "2026-08-05T02:45:04Z"
assignee: "row-count-is-debt-not-seeded-reasons"
blocked-by: null
closed-reason: null
---

## Context

The 2026-08-03 api-signals audit: 2,028 of 2,218 wide-baseline rows (91%)
still carry the RFC 0047 seeded default reason weeks after seeding, while the
row count itself burned 6,845 (2026-07-17) to 2,218 — rows converge by
DELETION (the port makes the call), not by hand-written equivalence review.
The per-file unreviewed high-water marks
(`scripts/api-compare/call-mismatches-wide-unreviewed/`, 373 marks totalling
2,028) are the operative control; per-row reason wordsmithing is not
happening and reviewer cycles spent demanding it are wasted.

## Acceptance criteria

- Recorded policy decision (RFC prose + CONTRIBUTING.md / CLAUDE.md where the
  reviewed-reason economy is described): wide ROW COUNT is the debt metric;
  the unreviewed-reason count is not tracked as debt.
- Reviewed reasons remain supported for rows an author chooses to justify
  (edited reason or `@missingRailsCall`), and the only-shrink unreviewed marks
  and stale-tag arms stay exactly as-is (every arm has a paid-for incident:
  #4020, #5869).
- No mechanical loosening: the ratchet, reseed-drift arm, and sharding are
  untouched.
