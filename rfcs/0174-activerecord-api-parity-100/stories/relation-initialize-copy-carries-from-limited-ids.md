---
title: "activerecord: Relation#initialize_copy carries a from relation's materialized limited ids"
status: draft
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Relation#initialize_copy` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`) is:

```ruby
def initialize_copy(other)
  @values = @values.dup
  reset
end
```

trails#8682 added one assignment to the port (`packages/activerecord/src/relation.ts`, `initializeCopy`):
`this._fromLimitedIds = other._fromLimitedIds`, after `this.reset()`.

`_fromLimitedIds` is a `WeakMap` from an eager-loaded, limited `from` source relation to the primary keys
`Relation#_materializeDeferredDistinctPkPredicates` fetched for it. `QueryMethods#build_from`
(`relation/query_methods.rb:1783-1796`) reads it so the executed SQL filters by ids, where Rails runs
`distinct_relation_for_primary_key` in line (`relation/finder_methods.rb:473-477`).

The carry exists because `pluck`, `ids` and the calculations (`packages/activerecord/src/relation/calculations.ts`)
drain the RECEIVER and then build the relation they run by copying it: `this.spawn()` in `pluck` and `ids`,
`rel.spawn()` / `rel.unscope(":order")` in `executeSimpleCalculation`, `rel.except("group")` in the grouped
calculation, and `relation.unscope(":order").buildSubquery(...)` inside `buildCountSubquery`. Every copy goes
through `initializeCopy`, whose `reset` clears the ids. Clearing them on copy was tried on #8682 and made
`count`, `pluck` and `ids` send `IN (SELECT DISTINCT … LIMIT …)` again, which MySQL rejects.

The assignment has no receipt: it is not a call or a control token, so `@inventedArm` does not apply, and
`no-freeform-comments` strips a prose cite. It is recorded only in the #8682 description.

One consequence: a copy that is never run can render, through the synchronous `toSql`, the ids its source
last fetched. A copy that runs a query materializes its own first.

## Acceptance criteria

- [ ] `initializeCopy` is `this._values = { ...this._values }; return this.reset();` again, with no
      `_fromLimitedIds` assignment.
- [ ] `count`, `pluck`, `ids`, `exists?`, `first` and load over an eager-loaded limited `from` relation still
      filter by materialized ids, with no `LIMIT` inside an `IN` subquery
      (`relation/eager-load-under-cte-and-from.trails.test.ts` stays green). The converged shape is each
      copied relation materializing its own ids before its `arel` is built, which is where Rails runs the
      query, rather than inheriting the receiver's.
- [ ] `toSql` on a copy that has not run renders the inline subquery, not a previous run's ids; a test pins it.
- [ ] If a derived relation cannot be drained before a synchronous `arel` build (`buildCountSubquery`'s
      `unscope(...).buildSubquery(...)`), the story is blocked with that site named, not closed by a receipt.
