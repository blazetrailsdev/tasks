---
title: "Narrow resolutionShapeKey from workspace-global to per-package deps"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 25
pr: 5434
claim: "2026-07-27T18:17:01Z"
assignee: "api-compare-resolution-shape-key-is-workspace-global"
blocked-by: null
closed-reason: null
---

## Context

`resolutionShapeKey` (`scripts/api-compare/shared-cache.ts`, PR #5380) hashes the
sorted NAMES of every `packages/*/dist/**/*.d.ts` in the workspace and is folded
into both TS extraction cache keys. It exists to catch what a read-set cannot:
a file that was not resolvable at extraction time (unbuilt dependency, no
`dist`) and now is.

It is deliberately GLOBAL, which makes it the one coarse edge left in an
otherwise per-file cache: adding or deleting ANY source file in ANY package
changes some `dist` file name and therefore invalidates all 13 packages, even
the ones that never resolve that package. Contents-only rebuilds are unaffected
(that was the point), so the common edit-a-method case stays precise — this only
bites on file add/delete/rename.

Narrowing it to each package's own transitive workspace dependencies would fix
that, but the graph helpers that made that possible (`readWorkspaceGraph`,
`transitiveDeps`) were deleted in the same PR as dead code, so this is a
deliberate simplicity-vs-precision trade to revisit with measurements rather
than a defect.

## Acceptance criteria

- Measure first: how often does an parity:api run in practice follow a file
  add/delete/rename? If it is rare, close this as not worth the graph.
- If it is worth doing, compute the shape key per package over its transitive
  workspace dependency directories only, restoring the graph walk.
- Adding a file to a package that a given package does not depend on must leave
  that package's entry valid.
- Cached vs `API_COMPARE_FORCE=1` parity still holds.
- Regression coverage in `scripts/api-compare/shared-cache.test.ts`.
