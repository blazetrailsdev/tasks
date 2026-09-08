---
title: "insertFixture builds its INSERT inline instead of delegating to build_fixture_sql"
status: claimed
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-08T19:43:53Z"
assignee: "rails-test-name-parity-rollout-actionview"
blocked-by: null
closed-reason: null
---

## Context

`insert_fixture` is a one-line delegation in Rails
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:482-484`):

```ruby
def insert_fixture(fixture, table_name)
  execute(build_fixture_sql(Array.wrap(fixture), table_name), "Fixture Insert")
end
```

trails' `insertFixture`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:611-646`)
instead builds the INSERT inline: it derives columns from the FIXTURE's own keys
rather than the table's, looks types up through an ad-hoc `columns(tableName)`
call plus a `Map`, quotes the values itself, and carries an
`emptyInsertStatementValue()` arm Rails has no counterpart for here.

This is the exact twin of `insert-fixtures-set-never-calls-build-fixture-statements`
(closed by #7592), which converged the PLURAL method. The singular one was out of
that story's scope and is still inline, so it keeps missing everything
`build_fixture_sql` does: schema-cache column iteration, the virtual-column
reject (`:608`), the unknown-column `Fixture::FixtureError` (`:613-616`), and the
per-adapter `default_insert_value` overrides — including the two bugs #7592 had
to fix in `build_fixture_sql` itself before the plural path worked
(`column.virtual?` read as a property; MySQL's `default_insert_value` never
wired onto `AbstractMysqlAdapter.prototype`).

## Converged shape

```ts
async insertFixture(fixture, tableName) {
  return this.execute(await buildFixtureSql.call(this, arrayWrap(fixture), tableName), "Fixture Insert");
}
```

`buildFixtureSql` is async (the schema cache is), so `insertFixture` stays async
and the inline column/value derivation, the `columns()`/`lookupCastTypeFromColumn`
lookup and the `emptyInsertStatementValue` arm all go away. Check
`Array.wrap`'s trails spelling rather than inlining a ternary.

## Acceptance criteria

- [ ] `insertFixture` is Rails' one-liner over `buildFixtureSql`, with no inline
      column derivation and no `emptyInsertStatementValue` arm.
- [ ] Its `call-mismatches-exclude` row (`insert_fixture` / `wrap`, in
      `activerecord/connection-adapters/abstract/database-statements.json`) is
      deleted rather than reseeded, if converging the body retires it.
- [ ] Fixture suites stay green on all three adapters — the doubles that stand in
      for a schema cache are already wired
      (`test-helpers/double-columns.ts`, added by #7592).
