---
title: "JoinAssociation#joinConstraints returns scope join sources inline, not via side-channel accumulators"
status: done
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6758
claim: "2026-08-20T02:22:31Z"
assignee: "collapse-collection-proxy-toarray-onto-load"
blocked-by: null
closed-reason: null
---

## Context

`JoinAssociation#join_constraints`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:64-69`)
emits the scope's own join sources INTO the array it returns, in place:

```ruby
joins << join_type.new(table, Arel::Nodes::On.new(nodes))

if others && !others.empty?
  joins.concat arel.join_sources
  append_constraints(joins.last, others)
end
```

trails' `packages/activerecord/src/associations/join-dependency/join-association.ts`
instead pushes them onto two trails-only accumulators — `joinSources` (flat) and
`joinSourcesByJoin` (bucketed by emitted join index) — and leaves them OUT of the
returned array. `JoinDependency#makeConstraints`
(`packages/activerecord/src/associations/join-dependency.ts`, post PR #6754) then
re-flattens them: it walks `built[i]`, pushes the join, then pushes
`child.joinSourcesByJoin[i]`, reconstructing by hand the order Rails already had.

Both accumulators are also mutable per-node state that has to be cleared at the
top of every `joinConstraints` call so a re-emit doesn't inherit the previous
emit's sources — a hazard that exists only because the sources leave the method
by a side channel.

## Converged shape

- `joinConstraints` pushes the scope's join sources into `joins` directly after
  the constraint join, as `joins.concat arel.join_sources` does, and
  `appendConstraints` targets `joins.last` (already the case, just now the same
  array).
- `joinSources` / `joinSourcesByJoin` and their per-call reset are deleted.
- `makeConstraints` stops interleaving: the array `joinConstraints` returns is
  the join list, and the per-node `scopeJoinSources` bookkeeping either goes away
  or is derived where the tree nodes actually need it (projection does not).
- The through-chain redistribution in `makeConstraints` must keep mapping
  `built[i]` back to its chain link; with sources inline the index math needs a
  marker for which entries are constraint joins — deriving it from the emitted
  order is the part to design, and is why this is its own story.

## Acceptance criteria

- [ ] `joinConstraints` returns joins and scope join sources in one array, in
      Rails' order (join_association.rb:64-69).
- [ ] `joinSources` and `joinSourcesByJoin` are gone from `JoinAssociation`,
      along with their per-emit reset.
- [ ] `makeConstraints` no longer re-interleaves sources by index.
- [ ] Alias + scope-join suites green on SQLite, PostgreSQL and MySQL/MariaDB:
      `join-dependency-through-aliasing`, `inner-join-association`,
      `left-outer-join-association`, `has-many-through-associations`, `eager`.
