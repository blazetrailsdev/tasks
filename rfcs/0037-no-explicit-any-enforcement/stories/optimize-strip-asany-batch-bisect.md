---
title: "Batch-then-bisect strip-asany recompile to cut O(casts) builds"
status: claimed
updated: 2026-06-23
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 5
pr: null
claim: "2026-06-23T22:30:39Z"
assignee: "optimize-strip-asany-batch-bisect"
blocked-by: null
---

## Context

`scripts/strip-asany.ts` (PR #3861) verifies each cast removal with a full
`tsc --build` — O(casts) rebuilds per file. Measured ~85s for a single-cast
file; the top-15 AR test files hold ~100 casts each, so per-file runtime is
~hours, which throttles the `burndown-tests-allowlist` epic.

Most candidates are gratuitous (removal keeps the build green), so the common
case is "all removals safe". A batch-then-bisect strategy collapses that to
~1 build: strip all candidates, build once; on success keep everything; on
failure bisect the candidate set to isolate the offending cast(s) and revert
only those (O(log n) builds). Falls back to the current per-cast loop only for
the residual conflicting set.

trails/Rails refs: `scripts/strip-asany.ts:120` (`stripFile` per-cast loop),
`scripts/strip-asany.ts:107` (`typecheckPasses`).

## Acceptance criteria

- `stripFile` strips all disjoint candidates and recompiles once; keeps all on
  green.
- On a failing batch, bisect to find the minimal reverted set; final tree is
  green and removal/kept counts still reported accurately.
- Behavior-equivalent to the current per-cast loop (same casts kept/removed);
  existing unit tests stay green, plus a test covering a batch with one
  load-bearing cast that must be isolated and reverted.
- Still per-file, no new deps, under 500 LOC.
