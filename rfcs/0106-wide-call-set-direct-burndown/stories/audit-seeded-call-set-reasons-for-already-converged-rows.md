---
title: "Audit the seeded call-set baseline reasons for rows whose divergence is already gone"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6815
claim: "2026-08-21T12:20:33Z"
assignee: "remeasure-collection-proxy-residue-after-the-burndown"
blocked-by: null
closed-reason: null
---

# Audit the seeded call-set baseline reasons for rows whose divergence is already gone

## Context

Surfaced by the review of PR #6728. That PR retired four
`readonly_attribute?` rows from
`scripts/api-compare/call-mismatches-exclude/activerecord/{readonly-attributes,attribute-methods}.json`.
The reviewer checked the call sites and found the rows' stored `reason` text
was **stale**: it described a body divergence that no longer existed —
`readonly-attributes.ts:142,166` and `attribute-methods.ts:625` already called
`ctor.readonlyAttributeQ(...)` directly. The rows were held open purely by a
gap in the naming table, not by anything in the bodies.

Every one of those rows carries the same seeded string:

    "Baseline (RFC 0047): wide call-set flag seeded when the wide ratchet
     landed; bucket (b) equivalent or (c) noise pending per-cluster burndown
     review."

That string was written once, in bulk, when the wide ratchet landed. It is
evidence about **when the row was seeded**, not about what the body does today.
Since then, hundreds of bodies have been converged by sibling RFC 0106 waves
without their rows being re-examined, so an unknown fraction of the ~1029
remaining baselined rows are in the same state the `readonly_attribute?` rows
were: already converged in the body, retirable by deletion alone, with no code
change at all.

This matters for burndown scheduling because the debt metric for this baseline
is the ROW COUNT (CONTRIBUTING.md, "Row count is the debt metric"). A row that
needs no code change is the cheapest possible row to retire, and right now
nothing distinguishes it from a row that needs a real port — so the waves are
being sized as though every row costs a body change.

## Converged shape

A measuring pass, not a code change. For each baselined row still carrying the
bulk-seeded RFC 0047 string, re-run the gate against the CURRENT build and
partition:

1. **Already converged** — the gate no longer reports the mismatch. Retire the
   row by deletion (`serializeBaseline`, then
   `pnpm parity:api:calls:tighten <shard>`; never `--write`, never a reseed).
2. **Still divergent** — leave the row, and record which cluster/RFC wave owns
   it so the next wave can be sized honestly.

Report the split so the remaining 0106 waves can be re-sized. Expect the
zero-code-change slice to be non-trivial: it was 4/8 of the rows PR #6728
touched.

Note the mechanism that produced the `readonly_attribute?` case specifically —
a row held open by a missing entry in `scripts/parity/conventions.ts` rather
than by a body divergence — and check whether other naming-table gaps are
holding rows open the same way. That class is retired by a conventions rule,
not by touching any port.

## Acceptance criteria

- [ ] Every remaining baselined `kind: "set"` row carrying the bulk-seeded
      RFC 0047 reason is classified as already-converged or still-divergent,
      measured with `API_COMPARE_FORCE=1 pnpm parity:api --calls` after a
      `pnpm build`.
- [ ] The already-converged slice is retired by hand via `serializeBaseline`
      plus `pnpm parity:api:calls:tighten` per shard. No `--write`, no reseed,
      no widened allowlist.
- [ ] The split is written up per shard/cluster so the remaining 0106 waves can
      be re-sized against it.
- [ ] Any row found to be held open by a naming-table gap rather than a body
      divergence is called out separately, with the `conventions.ts` rule that
      would retire it.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Split across PRs if the retirements exceed the LOC ceiling; file the rest.
