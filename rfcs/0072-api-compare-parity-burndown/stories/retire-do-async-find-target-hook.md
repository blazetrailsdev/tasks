---
title: "Delete the trails-only doAsyncFindTarget hook once findTarget is the only seam"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  ["singular-find-target-becomes-instance-method", "through-find-target-becomes-instance-method"]
deps-rfc: []
est-loc: 60
priority: null
pr: 6110
claim: "2026-08-05T01:29:56Z"
assignee: "model-name-i18n-keys-drops-model-name-fallback"
blocked-by: null
closed-reason: null
---

## Context

`doAsyncFindTarget` is a trails-only hook name with no Rails counterpart: Rails
has exactly one seam, `Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`),
which subclasses override.

PR #5366 converged the collection side and left the hook vestigial:

- `Association#findTarget` (`associations/association.ts`) is now the seam both
  load paths run — `_findTarget` (shared by `loadTarget` / `asyncLoadTarget`,
  which Rails inlines at `association.rb:189` and `:198`) and
  `CollectionAssociation#loadTarget` (mirroring
  `@target = merge_target_lists(find_target, target)`,
  `collection_association.rb:272-275`).
- `HasManyAssociation` overrides `findTarget`; its `doAsyncFindTarget` override
  was deleted as dead.
- `doAsyncFindTarget` now survives ONLY as the base delegate
  (`Association#findTarget` → `this.doAsyncFindTarget()`), kept so
  `HasOneAssociation` and `BelongsToAssociation` — which still override the old
  hook rather than `findTarget` — keep working unchanged.

Once the singular and through halves become instance methods, every subclass
overrides `findTarget` directly, the delegate has zero remaining overrides, and
the hook can be deleted outright.

Blocked on (do these first):

- `singular-find-target-becomes-instance-method`
- `through-find-target-becomes-instance-method`

Note for whoever picks this up: check `hoist-mid-load-guard-to-doasyncfindtarget-callers`
(RFC 0075) first — its caller inventory predates #5366, which removed the
`HasManyAssociation` override and repointed `CollectionAssociation#loadTarget`.

## Acceptance criteria

- No `doAsyncFindTarget` remains in `packages/activerecord/src` — neither the
  base declaration, the `Association#findTarget` delegation, nor any override.
- `HasOneAssociation` / `BelongsToAssociation` override `findTarget` directly.
- Comments and story/test prose referencing the old hook name are updated.
- has_one, has_one :through, belongs_to, has_many, has_many :through and
  collection-proxy suites pass; no test renames.
- No `node:*` imports, no `process.*`, async fs only, camelCase only.
- Under the 500 LOC ceiling. Single PR from `main`, no stacking.
