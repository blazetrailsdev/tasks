---
title: "CollectionProxy calculation overrides collapse to Rails' conditional calculate/pluck (collection_proxy.rb:724-730)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6609
claim: "2026-08-16T19:53:31Z"
assignee: "collection-proxy-calculations-to-two-overrides"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy` overrides exactly two calculation entry points,
and both are CONDITIONAL on `null_scope?`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:724-730`):

```ruby
def calculate(operation, column_name)
  null_scope? ? scope.calculate(operation, column_name) : super
end

def pluck(*column_names)
  null_scope? ? scope.pluck(*column_names) : super
end
```

`super` is `Relation`'s, run with `self` = the proxy — so on a NON-null
scope Rails calculates against the proxy's own relation state, and only a
null scope is redirected to `scope`. `sum` / `average` / `minimum` /
`maximum` / `count` have no `CollectionProxy` override at all; they reach
`Calculations#calculate` and therefore the single override above.
`Calculations` is not in the `delegate(*delegate_methods, to: :scope)`
list at `collection_proxy.rb:1128-1137` either — only `QueryMethods` and
`SpawnMethods` are.

trails (`packages/activerecord/src/associations/collection-proxy.ts`) has
a separate override for each of `count`, `sum`, `average`, `minimum`,
`maximum`, `pluck`, `pick`, and every one of them delegates to `scope()`
UNCONDITIONALLY — there is no `null_scope?` arm and no `super` arm. Before
PR #6601 each carried a `_relationStateDiverged()` branch that picked
`super` when the proxy had been bang-mutated; that branch was correctly
deleted with the mutation tracker (the bangs now land on `scope()`), but
the remaining shape still is not Rails': the unconditional `scope()`
delegation, and the per-operation overrides Rails does not have.

## Converged shape

Collapse the seven overrides to Rails' two, with Rails' guard:

- `calculate(operation, columnName)` — `isNullScope() ? scope().calculate(...) : super.calculate(...)`
- `pluck(...columnNames)` — `isNullScope() ? scope().pluck(...) : super.pluck(...)`

and delete the `count` / `sum` / `average` / `minimum` / `maximum` / `pick`
overrides so they inherit `Relation`'s and funnel through `calculate` as
they do in Rails. `null_scope?` is `collection_proxy.rb` /
`CollectionAssociation#null_scope?`.

Watch the in-memory fast paths the current `pluck` / `pick` bodies carry
(`allStrings && (this._isThrough || this._targetLoaded)` reads
`_readAttribute` off the loaded target instead of querying) — Rails has no
such arm, so it is either a separate deviation to file or folds into this
one.

## Acceptance criteria

- [ ] `CollectionProxy` has `calculate` and `pluck` overrides only, each
      with the `null_scope?` ternary from `collection_proxy.rb:724-730`.
- [ ] `count` / `sum` / `average` / `minimum` / `maximum` / `pick`
      overrides are deleted.
- [ ] Association + calculation tests green on SQLite, PostgreSQL and
      MySQL/MariaDB.
