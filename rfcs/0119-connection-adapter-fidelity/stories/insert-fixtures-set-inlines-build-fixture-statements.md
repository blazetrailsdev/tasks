---
title: "insertFixturesSet inlines build_fixture_statements instead of calling it"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
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

Surfaced while converging the host-optionality arms in the same body
(`drop-host-optionality-arms-in-truncate-and-fixtures-set`, PR #7250).

Rails' `insert_fixtures_set` builds its INSERT statements by delegating to a
private helper, and the delete statements are the only thing it maps inline
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:486-496`):

```ruby
def insert_fixtures_set(fixture_set, tables_to_delete = [])
  fixture_inserts = build_fixture_statements(fixture_set)
  table_deletes = tables_to_delete.map { |table| "DELETE FROM #{quote_table_name(table)}" }
  statements = table_deletes + fixture_inserts
  ...
```

with

```ruby
def build_fixture_statements(fixture_set)
  fixture_set.filter_map do |table_name, fixtures|
    next if fixtures.empty?
    build_fixture_sql(fixtures, table_name)
  end
end
```

(`database_statements.rb:649-654`).

trails inlines both helpers into the body
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
`insertFixturesSet`): it walks `Object.entries(fixtureSet)`, skips empty
fixture lists, and hand-builds each `INSERT INTO ... VALUES (...)` string,
including the empty-columns arm. Both Rails helpers already exist in the same
file and are exported in the `DatabaseStatements` bundle
(`buildFixtureStatements`, `buildFixtureSql`) — they are simply not called from
here, so the port carries two copies of the statement-building logic and
`parity:api:calls` records the omission.

The inlined arm also carries a host-optionality fallback Rails has no
counterpart for:

```ts
const emptyValue = this.emptyInsertStatementValue?.() ?? emptyInsertStatementValue();
```

`empty_insert_statement_value` is defined on `AbstractAdapter`
(`database_statements.rb:498`) for every adapter, so the `?.`/`??` arm is a
property of trails' `DatabaseStatementsHost` interface, not of Rails. It
disappears once the body stops building statements itself.

## Converged shape

`insertFixturesSet` reads:

```ts
const fixtureInserts = this.buildFixtureStatements(fixtureSet);
const tableDeletes = tablesToDelete.map((table) => `DELETE FROM ${this.quoteTableName(table)}`);
const statements = [...tableDeletes, ...fixtureInserts];
```

then the existing `transaction` / `disableReferentialIntegrity` /
`executeBatch` nest. The inlined loop and the
`emptyInsertStatementValue?.() ?? ...` fallback are deleted, and
`emptyInsertStatementValue` loses its `?` on `DatabaseStatementsHost` the way
`execute` / `executeBatch` / `transaction` / `disableReferentialIntegrity` did
in PR #7250.

Note the `?`-drop forces every fixture test double to supply the member — PR
#7250 hit exactly this and absorbed it with a shared `hostDefaults` spread in
`database-statements.trails.test.ts`, plus per-file additions in
`fixtures.test.ts`, `test-fixtures.test.ts` and
`test-helpers/fixtures/fixtures.trails.test.ts`. Those doubles also assert
against the `execute` mock in places; statements that move into `executeBatch`
need their assertions moved with them.

## Acceptance criteria

- [ ] `insertFixturesSet` calls `buildFixtureStatements` rather than inlining
      the per-table INSERT construction, matching database_statements.rb:486-496.
- [ ] The `emptyInsertStatementValue?.() ?? emptyInsertStatementValue()` arm is
      gone and the member loses its `?` on `DatabaseStatementsHost`.
- [ ] `pnpm parity:api:calls` shows the `insert_fixtures_set` →
      `build_fixture_statements` omission retired (delete the baseline row by
      hand; do not reseed).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
