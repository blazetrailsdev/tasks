---
title: "Port where_sql 'handles database-specific statements' via the engine argument"
status: ready
updated: 2026-07-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/arel/select_manager_test.rb:966-976` —
the third `where_sql` test, `handles database-specific statements`, is the only
one of the four still unported after #5180 (which landed the other three in
`packages/arel/src/select-manager.test.ts`, `describe("where_sql")`).

Rails' version swaps the connection's visitor for the duration of the test:

```ruby
old_visitor = Table.engine.lease_connection.visitor
Table.engine.lease_connection.visitor = Visitors::PostgreSQL.new Table.engine.lease_connection
...
_(manager.where_sql).must_be_like %{ WHERE "users"."id" = 10 AND "users"."name" ILIKE 'foo%' }
Table.engine.lease_connection.visitor = old_visitor
```

It was skipped in #5180 because that global-visitor swap is exactly the
mechanism RFC 0007 is removing; porting it against the current global
`_engine.current` would bake in the surface being deleted. Once `whereSql`'s
`engine` argument is the only visitor-selection path, this test should be
ported as an engine-argument test (pass a PostgreSQL-backed engine directly
rather than mutating a global).

## Acceptance criteria

- [ ] `handles database-specific statements` ported into
      `packages/arel/src/select-manager.test.ts` under `describe("where_sql")`,
      name verbatim.
- [ ] Selects the PostgreSQL visitor via the `engine` argument, not by
      mutating a global visitor.
- [ ] Asserts `ILIKE` for `matches`, matching the Rails expectation.
- [ ] test:compare delta non-negative.
