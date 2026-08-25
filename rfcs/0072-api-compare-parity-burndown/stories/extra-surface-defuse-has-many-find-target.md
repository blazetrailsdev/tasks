---
title: "extra-surface-defuse-has-many-find-target"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5939
claim: "2026-08-03T00:35:50Z"
assignee: "extra-surface-defuse-has-many-find-target"
blocked-by: null
closed-reason: null
---

## Context

`findTarget` (`packages/activerecord/src/associations/has-many-association.ts`,
relocated from `associations.ts#loadHasMany` by PR #5366) still FUSES three
concerns Rails keeps apart: building the association relation, the
instance-cache / preload short-circuit, and the strict-loading + `inverse_of`
wiring.

In Rails these are separate:

- `Association#scope` (`vendor/rails/activerecord/lib/active_record/associations/association.rb:107`)
  builds the relation — `target_scope.merge!(AssociationScope.scope(self))`.
- `Association#find_target` (`association.rb:248`) executes it and yields
  `set_inverse_instance` / `set_strict_loading` per record.
- `CollectionAssociation#load_target` owns the loaded/cached short-circuit.

Because trails has no `scope` seam, two `@internal` trails-only helpers had to
be invented to hand callers "the relation `findTarget` would run" without
running it:

- `buildHasManyRelation` — `packages/activerecord/src/associations.ts`
- `buildThroughJoinScope` — `packages/activerecord/src/associations.ts`

(re-derive line numbers with
`grep -n '^export function buildHasManyRelation\|^export function buildThroughJoinScope' packages/activerecord/src/associations.ts`)

Splitting the relation-building half of `findTarget` out into the Rails
`Association#scope` seam would let both helpers be **deleted outright** and
their callers routed through `scope()`.

PR #5366 deliberately left this alone: it was scoped to the relocation +
rename, and the de-fusion did not fit under the LOC ceiling alongside it.

## Acceptance criteria

- The relation-building half of `findTarget` lives behind a Rails-named
  `scope` seam; `findTarget` executes that relation rather than rebuilding it.
- `buildHasManyRelation` and `buildThroughJoinScope` are DELETED from
  `packages/activerecord/src/associations.ts`, with every caller routed
  through the `scope` seam. No re-export under the old names.
- `pnpm parity:api && pnpm parity:api:extra --package activerecord --novel-only`
  shows the `associations.ts` novel count drop by 2 (or by however many of the
  two names the extras report actually lists). Record before/after in the PR
  body.
- Association test suites covering has_many and has_many :through pass; no
  test renames.
- No `node:*` imports, no `process.*`, async fs only, camelCase only.
- Under the 500 LOC ceiling. Single PR from `main`, no stacking.
