---
title: "CollectionProxy delegates QueryMethods/SpawnMethods to scope, retiring _finderScope"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6595
claim: "2026-08-16T13:15:03Z"
assignee: "collection-proxy-delegate-query-methods-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy` does not build queries itself. It delegates every
`QueryMethods` / `SpawnMethods` builder to the association scope:

```ruby
delegate_methods = [QueryMethods, SpawnMethods].flat_map { |klass|
  klass.public_instance_methods(false)
} - self.public_instance_methods(false) - [:select] + [
  :scoping, :values, :insert, :insert_all, ... :load_async
]
delegate(*delegate_methods, to: :scope)
```

(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`,
with `scope` itself memoized at `:1119` and cleared by `reset_scope`, `:1112-1116`.)

That single delegation is why Rails' finder overrides are bare two-liners: the
inherited `FinderMethods` body calls `limit(1)` / `reverse_order` and those go
to the scope automatically, so `#take` and `#last` are just
`load_target if find_from_target?; super` (`:259-262`, `:289-292`) and `#first`
needs no override at all.

trails' `CollectionProxy` instead inherits `Relation`'s builders, so
`this.limit(1)` clones the PROXY's own relation state — which can carry a stale
new-owner `1=0` FK seed. PR #6592 worked around this with
`CollectionProxy#_finderScope()`
(`packages/activerecord/src/associations/collection-proxy.ts`), a private helper
that returns `this.scope()` when unmutated, `this` when loaded, and a rebased
clone when `_cpMutated`. Every finder override then routes its query through it:
`findTake`, `findTakeWithLimit`, `findNthWithLimit`, `findNthFromLast`, `last`.

`_finderScope()` has no Rails counterpart. It is the reason four
`CollectionProxy` finder overrides still exist at all (Rails has overrides only
for `find_nth_with_limit` / `find_nth_from_last`, and they contain no scope
plumbing), and it is why the `@take` memo lands on the memoized scope object
rather than on the proxy as in Rails.

## Converged shape

Delegate the `QueryMethods` / `SpawnMethods` builders on `CollectionProxy` to
`scope()` as Rails does, rather than inheriting `Relation`'s. Once
`this.limit(n)` on a proxy builds off the association scope:

- `CollectionProxy#findTake` / `#findTakeWithLimit` delete entirely (Rails has
  no such overrides).
- `#findNthWithLimit` / `#findNthFromLast` reduce to Rails' exact
  `load_target if find_from_target?; super`, with no `_finderScope()` call.
- `#last` reduces to the same two lines.
- `#first` deletes entirely (blocked also on the `_isEmptyRelation` story).
- `_finderScope()` and the `_cpMutated` / `_seededNoneNewOwner` rebase
  machinery it feeds delete with it.

Note the interaction with the trails-only `@take`-memo host: Rails keeps
`@take` on the proxy and only the query on the scope. Converging the delegation
restores that split for free.

## Scope split (PR #6595)

The four acceptance criteria below are met by delegating the NON-bang half of
`QueryMethods` / `SpawnMethods`, which is all `_finderScope()` stood in for. Two
items from "Converged shape" above move out of this story:

- The `_cpMutated` / `_seededNoneNewOwner` rebase machinery does NOT delete
  here. Rails delegates the bang builders too (`where!`, `limit!`, `none!` are
  in `QueryMethods.public_instance_methods(false)`), but trails'
  `CollectionProxy` ctor seeds its own inherited `Relation` state through
  `noneBang` / `extendingBang` / `_copyStateFrom`, and `toArray` / `deleteAll` /
  the calculation overrides read that state back through `_cpMutated` —
  delegating the bangs means deleting all of it, past this story's LOC ceiling.
  Tracked as `collection-proxy-delegate-query-method-bangs-to-scope`.
- `#first` stays, as this story already notes: it is blocked on the
  `_isEmptyRelation` story.

## Acceptance criteria

- [ ] `CollectionProxy` delegates the `QueryMethods` / `SpawnMethods` builder
      set to `scope()`, per `collection_proxy.rb:1128-1137`.
- [ ] `_finderScope()` is deleted, and every finder override that called it is
      either deleted or reduced to `load_target if find_from_target?; super`.
- [ ] The `@take` / `@offsets` memos sit on the proxy, as in Rails.
- [ ] Association finder tests stay green on SQLite, PostgreSQL and MySQL/MariaDB.
