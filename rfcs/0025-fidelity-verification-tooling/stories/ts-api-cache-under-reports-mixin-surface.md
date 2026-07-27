---
title: "api-compare: ts-api cache serves a smaller manifest than a forced extraction"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: 5380
claim: "2026-07-27T15:43:45Z"
assignee: "ts-api-cache-under-reports-mixin-surface"
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Found while measuring PR #5335 (2026-07-25). The ts-api cache
(`scripts/api-compare/output/ts-api-cache/<package>.json`, keyed by
`packageFingerprint` + `SCHEMA_VERSION`, see
`scripts/api-compare/extract-ts-api.ts:30-53`) yields a **materially
different manifest** from a forced extraction of the _same_ tree — this is
a correctness bug, not just a staleness/perf nuance.

Measured on unmodified `origin/main`, `pnpm api:extra --package
activerecord`:

- cached run: 217 files, 776 novel, 2084 moved, 2860 total
- `API_COMPARE_FORCE=1` run: 217 files, 794 novel, 2315 moved, 3109 total

The divergence localizes to the mixin-returning-function pass
(`extractFromProgram`, the `__mixin` module harvest): e.g.
`inheritance.ts:computeType__mixin` carries 136 instance methods in the
cached manifest vs 231 forced, and the same 136 -> 231 gap appears on
every `__mixin` entry in `inheritance.ts` and `associations.ts`. Those
extra ~95 names are inherited `Base` surface (`attributes`, `changes`,
`changedAttributes`, ...), so the harvested instance type depends on
program/TypeChecker state that the fingerprint does not capture.

Consequence: any before/after comparison that mixes a cached run with a
forced run is invalid, and #5316-style ratchets/exclude files keyed off
cached output can encode the under-reported set.

## Acceptance criteria

- Root-cause why the `__mixin` instance-type harvest resolves a smaller
  property set on the cached path (candidate: cross-package extraction is
  skipped on a cache hit, so the checker never materializes the ancestor
  types the mixin return type resolves through).
- Cached and `API_COMPARE_FORCE=1` runs of the same tree produce byte-identical
  `ts-api.json` for activerecord (or the cache is narrowed so the differing
  entries are never served from it).
- A test or CI check pins the invariant so it cannot silently regress.
- Re-baseline any ratchet/exclude manifest whose current contents were
  generated from the cached (under-reporting) path.
