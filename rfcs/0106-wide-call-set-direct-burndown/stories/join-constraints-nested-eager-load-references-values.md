---
title: "joinConstraints skips Rails' references_values nested construct_join_dependency block"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`JoinAssociation#join_constraints`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:45-55`)
builds a nested join dependency for an association scope that eager-loads:

```ruby
scope = reflection.join_scope(table, foreign_table, foreign_klass)

unless scope.references_values.empty?
  associations = scope.eager_load_values | scope.includes_values

  unless associations.empty?
    scope.joins! scope.construct_join_dependency(associations, Arel::Nodes::OuterJoin)
  end
end

arel = scope.arel(alias_tracker.aliases)
```

trails' `packages/activerecord/src/associations/join-dependency/join-association.ts`
skips that whole block and goes straight to `scope.arel(aliasTracker)`, with a
standing `// TODO:` in the body saying so. An association scope that calls
`references` plus `includes`/`eagerLoad` therefore emits without the nested
OUTER JOINs Rails adds, so its WHERE can name a table that is never joined.

`Relation#constructJoinDependency` and the `build_joins` emitter both exist in
trails now (RFC 0027 / 0106 landed them), so the pieces this needs are in place.

## Converged shape

- Port the `unless scope.references_values.empty?` guard verbatim, including the
  `eager_load_values | includes_values` union and the inner `unless
associations.empty?` guard — same branch order, same early exits.
- Call `scope.joinsBang(scope.constructJoinDependency(associations,
Nodes.OuterJoin))`, matching `scope.joins!` with `Arel::Nodes::OuterJoin`.
- Delete the `TODO` comment; the deviation is the TODO, and it converges rather
  than getting reworded.

## Acceptance criteria

- [ ] `joinConstraints` mirrors join_association.rb:45-55 branch for branch.
- [ ] A regression test with an association scope that both `references` and
      `includes`/`eagerLoad`s another association emits the nested OUTER JOIN;
      the test fails on the pre-fix baseline.
- [ ] `pnpm parity:api:calls` / `:args` green.
- [ ] Alias + eager suites green on SQLite, PostgreSQL and MySQL/MariaDB.
