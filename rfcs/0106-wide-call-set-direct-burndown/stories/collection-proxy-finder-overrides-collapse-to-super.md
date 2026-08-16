---
title: "CollectionProxy first/take/last collapse to Rails' bare load_target-then-super"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6592
claim: "2026-08-16T02:15:03Z"
assignee: "collection-proxy-finder-overrides-collapse-to-super"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#first` / `#take` / `#last` are each a bare two-liner —
`load_target if find_from_target?; super`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:259`,
`:289`; `first` has no override at all). All the finder logic, including the
`@offsets` / `@take` memos, lives in `FinderMethods` and runs with `self` = the
proxy.

trails' overrides are far larger. After PR #6588 (which converged the memo
slots themselves onto `Relation#_take` / `_offsets`), two structural
deviations remain in
`packages/activerecord/src/associations/collection-proxy.ts`:

1. **`take()` hand-rolls the `@take ||=` memo.** `first()` can delegate to
   `findNth(this, 0)` because `findNth` reaches the query through the
   polymorphic `this.findNthWithLimit`, which the proxy overrides onto
   `_finderScope()`. `findTake` has no such seam — it calls
   `rel.limit(1).records()` directly
   (`packages/activerecord/src/relation/finder-methods.ts:939-945`), so
   `findTake(this)` would build the query off the proxy's own relation state
   (which can carry a stale new-owner `1=0` FK seed) instead of
   `_finderScope()`. The proxy therefore inlines
   `this._take ??= await baseFindTake(this._finderScope())` rather than
   calling `super` (`collection-proxy.ts:2400`).

2. **The `find_from_target?` / loaded-target branches are open-coded** in
   `first()`, `take()` and `last()` instead of Rails' single
   `load_target if find_from_target?; super`. The proxy keeps loaded state in
   `_target` / `_targetLoaded` rather than `Relation`'s `_records` / `_loaded`,
   so each override re-implements the loaded arm that `find_nth_with_limit`
   (`finder_methods.rb:603-605`) and `find_take` (`:583-587`) already have.

## Converged shape

Give `findTake` the same polymorphic seam `findNth` has — route its query
through an overridable method the proxy can point at `_finderScope()` — so
`CollectionProxy#take` collapses to `load_target if find_from_target?; super`.
Then close the `_target` / `_targetLoaded` vs `_records` / `_loaded` split (or
make `isLoaded` / `records()` on the proxy read the target) so the loaded arms
in `first()` / `take()` / `last()` can be deleted in favour of the base
`FinderMethods` bodies.

Blocked-ish note: this depends on the `_finderScope()` question — Rails'
proxy delegates every query to `association.scope`
(`collection_proxy.rb:1128-1131`), which is what `_finderScope` approximates.
Converging that delegation properly is the larger prerequisite.

## Acceptance criteria

- [ ] `CollectionProxy#take` is `load_target if find_from_target?; super`,
      with the query still resolved against the live association scope.
- [ ] `first()` / `last()` shed their open-coded loaded-target arms.
- [ ] Association finder tests stay green on SQLite, PostgreSQL and
      MySQL/MariaDB.
