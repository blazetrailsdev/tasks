---
title: "Per-row sign-off for multi-token divergences the call-grain catalog cannot explain"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5798
claim: "2026-08-01T13:23:49Z"
assignee: "guard-per-row-signoff"
blocked-by: null
closed-reason: null
---

## Context

PR #5789 landed the convergence guard: `pnpm codegen:score --guard` subtracts
the deviation catalog and ratchets the residue against
`scripts/prism-codegen/convergence-baseline.json`.

The subtraction only explains **11 of 371** divergent+missing rows. The reason
is structural, not a bug: the call-mismatches exclude lists are keyed at the
individual-call grain (`scripts/api-compare/lint-call-mismatches.ts`), while
`catalogueDivergent` (`scripts/prism-codegen/catalog.ts`) demands that _every_
differing skeleton token be individually excluded — no partial credit, by
design. Most real divergences differ by several tokens at once (a dropped `if`
plus two renamed calls), so a reviewer who has confirmed a whole method's
divergence as equivalent has **no way to record that verdict**; the row can only
leave the residue by converging, or by staying in the baseline forever
indistinguishable from unreviewed debt.

api-compare already solved the same problem one level up with `body-pins.json`
(`scripts/api-compare/body-pins.ts`): a per-method, reason-carrying sign-off.

## Acceptance criteria

- A per-row sign-off file (shape modeled on `body-pins.json`: keyed by
  `<rubyFile>::<name>`, mandatory `reason`) that removes a reviewed row from the
  guarded residue, distinct from the baseline of unreviewed debt.
- `--verbose` distinguishes the three buckets: catalogued-by-call,
  signed-off-per-row, and unreviewed residue.
- A lint that fails on a sign-off entry whose row no longer appears (stale
  sign-off), mirroring the wide gate's stale-entry half.
- The seeded baseline shrinks by exactly the rows moved to sign-off; no row is
  in both files.
