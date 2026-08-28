---
title: "Promote arity mismatches from advisory to an only-shrink ratchet"
status: ready
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The 2026-08-03 api-signals audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/api-signals-20260803T210012Z.md`)
found 83 live arity mismatches in `output/arity-mismatches.json` with only 1
reasoned exclusion in `scripts/api-compare/arity-exclude.json`. The gate,
`scripts/api-compare/lint-arity-excludes.ts:9-10`, explicitly does NOT ratchet
new mismatches — it only validates the exclude file (malformed/stale rows).
Arity is the largest measured-but-ungated fidelity dimension.

All required machinery already exists and is proven shared:
`diffAgainstBaseline`, `reseed`, `missingScope`, and `compareKeys` in
`scripts/api-compare/lint-call-mismatches.ts` are already imported by
`lint-call-mismatches-wide.ts`. The artifact records `packages` for the
partial-scope determinism guard.

## Acceptance criteria

- A committed baseline seeds the current 83 arity mismatches (keyed like the
  call baselines: package + tsFile + rubyName), each row carrying a seeded
  default reason.
- `pnpm parity:api:arity` (or a sibling lint) fails CI on any NEW arity mismatch
  absent from the baseline and on any STALE baseline row (only-shrink).
- The existing `arity-exclude.json` semantics (reasoned, hand-written, no
  `--write`) are preserved or explicitly folded into the new baseline with the
  reason retained.
- The partial-scope guard aborts gating/reseeding from a `--package`-filtered
  artifact, matching `lint-call-mismatches.ts`.

## Re-verified 2026-08-17 (draft sweep)

Still valid; **numbers refreshed** against a full rebuild +
`API_COMPARE_FORCE=1 pnpm parity:api` on 2026-08-17:

- arity mismatches: **83 → 99** (8,415 compared)
- `scripts/api-compare/arity-exclude.json`: **1 → 0** reasoned exclusions

So the gap widened and the one exclusion that existed has been retired.
`lint-arity-excludes.ts:9-10` still states explicitly that it is NOT a ratchet.
Title was a slug placeholder; set to a real title.
