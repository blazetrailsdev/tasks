---
title: "Audit remaining associations.ts relocation stories for dead code before relocating"
status: closed
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "obsolete: all 11 extra-surface-relocate-* stories for associations.ts shipped (PRs #5355-#5373) before this audit ran; no open or unfiled relocation story remains to correct. Spot-check of the survivors (reflectLockVersionBump, habtmTargetFk, buildThroughJoinScope) confirms each has production callers outside associations.ts, so no dead code was relocated."
---

## Context

RFC 0072's `extra-surface-associations-engine-classify` sorted `associations.ts`'s
novel extras into (a) invention, (b) `@internal`/allowlist, (c) misplaced port, and
spawned one relocation story per name in group (c). That classification read
declarations only — it did not check call sites.

`extra-surface-relocate-load-habtm` (PR #5342 era spec, shipped as #5362) was
specified as "fold `loadHabtm` into the has_many-through `findTarget`". In fact
`loadHabtm` had **zero production callers**: `Builder::HasAndBelongsToMany` rewrites
HABTM into a `has_many :through` at declare time
(`packages/activerecord/src/associations.ts`, `HabtmBuilder.build`; Rails
`vendor/rails/activerecord/lib/active_record/associations.rb:1896-1905`), so every
real HABTM load already ran through the through path. The correct action was
deletion, not relocation — the story shipped as a pure deletion.

Second data point from the same PR: `fireAssocCallbacks` in `associations.ts` was
likewise dead and was deleted outright by a sibling story mid-flight. During a
rebase it was silently _reintroduced_ by taking one side of a three-way conflict
wholesale, and was caught only because the `parity:api:extra` novel count failed to drop.

Remaining relocation stories at time of filing: `extra-surface-relocate-load-has-one`,
`extra-surface-relocate-load-through`, `extra-surface-relocate-update-counter-caches`
(all in-progress), plus `extra-surface-relocate-*` names not yet filed. Some are
likely deletions rather than relocations, and relocating dead code costs review
cycles and manufactures rebase conflicts for siblings touching the same file.

## Acceptance criteria

- For each remaining `associations.ts` novel extra with an open/unfiled relocation
  story, record whether it has production callers (callers outside its own
  definition, tests, and `index.ts` re-exports).
- Reclassify the callerless ones as deletions and correct their story bodies so the
  claiming agent is not sent to relocate dead code.
- Note the rebase hazard in the affected story bodies: when `associations.ts`
  conflicts, resolve to `main`'s side minus the name being removed, and re-measure
  the `parity:api:extra` baseline against the new `main` (absolute counts drift down as
  siblings land).
