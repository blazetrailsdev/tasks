---
title: "Build JoinDependency joins through one child.joinConstraints block, not build-then-rebuild"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#make_constraints`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:189-211`)
BUILDS each join here:

```ruby
foreign_table = parent.table
foreign_klass = parent.base_klass
child.join_constraints(foreign_table, foreign_klass, join_type, alias_tracker) do |reflection, remaining_reflection_chain|
  ...
  table = alias_tracker.aliased_table_for(...) { ... }
  ...
end.concat child.children.flat_map { |c| make_constraints(child, c, join_type) }
```

trails' `packages/activerecord/src/associations/join-dependency.ts`
`makeConstraints` (post PR #6751) resolves the alias through
`aliasTracker.aliasedTableFor` with Rails' arguments and candidate block — that
half converged — but it does NOT call `child.joinConstraints(...)` with the
block. Instead the ON is pre-built at tree-construction time (`addAssociation`,
`_addThroughViaJoinAssociation`) against the REAL table and then REBUILT at emit
by the trails-only helpers `_rebuildChildJoin` and `_resolveThroughGroup`, which
re-run `JoinAssociation#joinConstraints` with a resolver callback and then rebind
scope/STI predicates via `rebindTableReferences`.

That build-then-rebuild round trip is the structural deviation that remains: one
Rails method is three trails methods, the ON is constructed twice, and the
rebind pass exists only because the first construction used the wrong table.

## Converged shape

- `makeConstraints` calls `child.joinConstraints(parent.table, parent.baseKlass,
joinType, aliasTracker, block)` once, with the block doing the memo lookup +
  `aliasedTableFor` resolution it already does today, and returns those joins
  concatenated with the recursion over `child.children`.
- Construction (`addAssociation`) stops pre-building `arelJoin`, so
  `_rebuildChildJoin` and the `rebindTableReferences` fix-up pass are deleted.
- `_resolveThroughGroup` collapses into the same single call: Rails gets the
  whole `reflection.chain` walked by `JoinAssociation#join_constraints`
  (`associations/join_association.rb`) through this one block.

## Acceptance criteria

- [ ] `makeConstraints` builds each join through one
      `child.joinConstraints(...)` call with Rails' argument list and block.
- [ ] `_rebuildChildJoin` is deleted; no emit-time `rebindTableReferences` pass
      remains for the alias case.
- [ ] `pnpm parity:api:calls` / `:args` green; `parity:api:extra --package
  activerecord` shows `associations/join-dependency.ts` novel count reduced.
- [ ] Alias suites green on SQLite, PostgreSQL and MySQL/MariaDB:
      `join-dependency-alias-tracker`, `join-dependency-through-aliasing`,
      `join-dependency-belongs-to-dedup`, `join-dependency-duplicate-objects`,
      `inner-join-association`, `left-outer-join-association`, `eager`.
