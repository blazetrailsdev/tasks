---
title: "performFirst/performLast drop the trails-only _isEmptyRelation guard"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6596
claim: "2026-08-16T14:15:03Z"
assignee: "retire-is-empty-relation-guard-from-finder-entry-points"
blocked-by: null
closed-reason: null
---

## Context

`Relation#first` and `#last` in trails open with a short-circuit that Rails does
not have:

```ts
// packages/activerecord/src/relation/finder-methods.ts — performFirst
if (this._isEmptyRelation()) return n !== undefined ? [] : null;
```

Rails' bodies have no counterpart. `first` is
`limit ? find_nth_with_limit(0, limit) : find_nth(0)`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:173-179`)
and `last` is `return find_last(limit) if loaded? || has_limit_or_offset?` then
the reverse-order query (`:202-208`). A Rails `none` relation returns nothing
because `NullRelation#exec_queries` yields `[]`, not because the finder checks a
flag up front.

`_isEmptyRelation()` is the trails none-gate, overridden on `CollectionProxy` /
`AssociationRelation` to also rebase a stale new-owner `1=0` FK seed. Its
placement is load-bearing in a bad way: on a proxy whose owner was a new record
at seed time, `_isNone` is true, so routing a loaded proxy through
`Relation#first` returns null even though the in-memory target has records.

PR #6592 hit this twice:

- `performLast` had to be reordered so the `loaded? || has_limit_or_offset?`
  arm runs BEFORE the `_isEmptyRelation()` gate — which is Rails' order anyway
  (`finder_methods.rb:203`), so that half is already converged.
- `CollectionProxy#first` could NOT collapse to a bare `super` and still exists
  only to skip the gate. Its body is otherwise `performFirst` verbatim
  (`packages/activerecord/src/associations/collection-proxy.ts`).

## Converged shape

Make the none short-circuit faithful — the empty result should come from the
query/exec path (Rails' `NullRelation#exec_queries` → `[]`) rather than from a
guard at the top of each finder — and move the new-owner-seed rebase off the
finder entry points. Then:

- `performFirst` drops its `_isEmptyRelation()` line and matches
  `finder_methods.rb:173-179` exactly.
- `performLast` drops its remaining `_isEmptyRelation()` line and matches
  `:202-208` exactly.
- `CollectionProxy#first` deletes entirely, as in Rails, where the proxy has no
  `first` override — `find_nth_with_limit` (`collection_proxy.rb:1140-1143`)
  already carries the `load_target if find_from_target?`.

## Acceptance criteria

- [ ] `performFirst` / `performLast` carry no `_isEmptyRelation()` guard and
      match their Rails bodies line for line.
- [ ] A `none` relation and a new-owner-seeded proxy still return `[]` / `null`,
      via the exec path rather than a finder guard.
- [ ] `CollectionProxy#first` is deleted.
- [ ] Relation and association finder tests stay green on SQLite, PostgreSQL
      and MySQL/MariaDB.
