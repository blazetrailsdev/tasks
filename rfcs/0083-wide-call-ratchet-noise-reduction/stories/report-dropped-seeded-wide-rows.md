---
title: "Report dropped SEEDED wide baseline rows, not just reviewed ones"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5873
claim: "2026-08-02T11:36:48Z"
assignee: "report-dropped-seeded-wide-rows"
blocked-by: null
closed-reason: null
---

## Context

`renderDroppedReviewed` (`scripts/api-compare/unreviewed-ratchet.ts`) lists
baseline rows a reseed dropped that carried a HAND-WRITTEN reason, so the author
can spot-check whether the row cleared because the port converged or because a
resolution gate widened. Rows still carrying `DEFAULT_REASON` are dropped
silently.

That hole was exercised in PR #5869: five seeded rows in
`call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`
disappeared with no signal beyond the STALE gate arm, and were removed on CI's
word without anyone establishing which of the two causes applied. Seeded rows
are the overwhelming majority of the baseline (2154 of 2329 at that commit), so
the spot-check surface currently covers ~7% of drops.

## Acceptance criteria

- A reseed reports dropped SEEDED rows too — at minimum a count, ideally the
  keys behind a flag — so a widened gate silently clearing hundreds of rows is
  distinguishable from real convergence.
- Keep the existing reviewed-row listing unchanged; it is the louder signal.
