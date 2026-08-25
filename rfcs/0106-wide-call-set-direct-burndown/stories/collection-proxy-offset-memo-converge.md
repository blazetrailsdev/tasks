---
title: "collection-proxy-offset-memo-converge"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6588
claim: "2026-08-16T01:29:00Z"
assignee: "collection-proxy-offset-memo-converge"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy` carries `_offsetMemo` (a `Map<string, T | null>` keyed
`"first"` / `"take"`, `packages/activerecord/src/associations/collection-proxy.ts:204`),
an invented stand-in for Rails' `@take` / `@offsets` ivars. Rails'
`CollectionProxy#reset_scope` clears exactly those two ivars
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1113`:
`@offsets = @take = nil`) — the same slots `FinderMethods#find_take` /
`#find_nth` write (`finder_methods.rb:586`, `:599-600`).

Those slots now exist on `Relation` as `_take` / `_offsets`, cleared by
`Relation#reset` (PR #6586). The proxy still does not use them: its `first()`
override memoizes into `_offsetMemo` around a direct `findNthWithLimit(0, 1)`
call (`collection-proxy.ts:2320`), and its `take()` override runs
`baseFindTake(this._finderScope())` — a _different_ relation object, so the
`_take` memo would land on a throwaway scope rather than the proxy
(`collection-proxy.ts:2406`). Converging needs the finder scope question
answered, which is why it was left out of #6586.

## Acceptance criteria

- [ ] `CollectionProxy` no longer carries `_offsetMemo`; `first()` / `take()`
      memoize through `Relation`'s `_take` / `_offsets` as Rails does.
- [ ] `resetScope` clears them per `collection_proxy.rb:1113`, and the
      scope-mutator bang path (`collection-proxy.ts:781`) plus
      `_invalidateAssociationIds` clear the same slots.
- [ ] Existing association finder tests stay green on SQLite, PostgreSQL and
      MySQL/MariaDB.
