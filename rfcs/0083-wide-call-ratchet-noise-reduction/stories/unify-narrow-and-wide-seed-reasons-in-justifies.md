---
title: "Make justifies() reject the narrow RFC 0044 seed reason too"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5872
claim: "2026-08-02T11:26:49Z"
assignee: "unify-narrow-and-wide-seed-reasons-in-justifies"
blocked-by: null
closed-reason: null
---

## Context

`justifies()` (`scripts/api-compare/missing-rails-call-tags.ts`) rejects exactly
one seed string: the wide baseline's `DEFAULT_REASON` (RFC 0047 prose). The
narrow baseline has its own, distinct seed — `DEFAULT_REASON` in
`scripts/api-compare/lint-call-mismatches.ts:80` ("Baseline (RFC 0044):
pre-existing call-set flag inherited when the ratchet landed; pending
per-cluster burndown review."), which is module-private and not exported.

So a `@missingRailsCall` tag carrying the RFC 0044 seed WOULD satisfy
`justifies()` and suppress its wide flag, blessing a row nobody reviewed. The
same asymmetry runs through `parity:api:build` (#5857): after that PR the generator
skips minting a tag for a wide-seeded row, but would happily mint one for a
narrow-seeded row and migrate it out of the baseline.

Not currently live: all 14 rows in `call-mismatches-exclude.json` carry curated
prose today (verified while working #5857), so nothing is mis-suppressed. It
becomes live the moment `reseed()` (`lint-call-mismatches.ts:212`) stamps the
default on a newly-flagged narrow call.

Deliberately left out of #5857 because widening `justifies()` moves the wide
gate and needs its own before/after count.

## Acceptance criteria

- Both seed strings are known to one predicate: export the narrow
  `DEFAULT_REASON` (or move both into `missing-rails-call-tags.ts`) and have
  `justifies()` reject each.
- `parity:api:build` mints no tag for a narrow-seeded row either, matching the wide
  policy shipped in #5857.
- Record the before/after `parity:api:calls` count in the PR body; the gate must
  not silently move.
- Unit coverage in `missing-rails-call-tags.test.ts` for a tag carrying the
  narrow seed, alongside the existing wide-seed case.
