---
title: "build-fixture-sql-ignores-schema-cache-columns-and-default-insert-value"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while attempting `insert-fixtures-set-inlines-build-fixture-statements`
(RFC 0119): that story converges `insertFixturesSet` onto `buildFixtureStatements`,
but doing so routes every fixture load through `buildFixtureSql`, which is not a
faithful port and breaks on SQLite.

Rails' `build_fixture_sql`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:608-647`)
takes its column list from the schema cache and fills a missing value with the
adapter's `default_insert_value`:

```ruby
def build_fixture_sql(fixtures, table_name)
  columns = schema_cache.columns_hash(table_name).reject { |_, column| supports_virtual_columns? && column.virtual? }

  values_list = fixtures.map do |fixture|
    fixture = fixture.stringify_keys
    unknown_columns = fixture.keys - columns.keys
    if unknown_columns.any?
      raise Fixture::FixtureError, %(table "#{table_name}" has no columns named #{unknown_columns.map(&:inspect).join(', ')}.)
    end
    columns.map do |name, column|
      if fixture.key?(name)
        type = lookup_cast_type_from_column(column)
        with_yaml_fallback(type.serialize(fixture[name]))
      else
        default_insert_value(column)
      end
    end
  end
  ...
```

`default_insert_value` is `Arel.sql("DEFAULT")` on the abstract adapter
(`database_statements.rb:603-605`) but is overridden by SQLite3 to return the
column's own default
(`sqlite3/database_statements.rb:139-145`), precisely because SQLite rejects the
bare `DEFAULT` keyword inside a multi-row `VALUES` list.

trails' `buildFixtureSql`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
~line 1195) diverges on all three points:

- it builds `allColumns` from the UNION of the fixture rows' own keys rather
  than from `schemaCache.columnsHash(tableName)`, so it has no `Column` to hand
  anywhere;
- it therefore hardcodes a module-local `DEFAULT_VALUE = arelSql("DEFAULT")`
  instead of calling `this.defaultInsertValue(column)` — the ported
  `defaultInsertValue` exists on all three adapters
  (`abstract/database-statements.ts:1191`,
  `sqlite3/database-statements.ts:316`, `mysql/database-statements.ts:79`) and
  is simply never called from here;
- it never serializes through `lookupCastTypeFromColumn` (the sibling
  `insertFixture`, `database-statements.ts:606-640`, does) and never raises
  `Fixture::FixtureError` for unknown columns.

The consequence is direct: with `insertFixturesSet` delegating to
`buildFixtureStatements`, `packages/activerecord/src/test-fixtures.test.ts` fails
with `SqliteError: near "DEFAULT": syntax error` on every multi-row table whose
fixture rows do not all carry the same keys. It stays hidden today only because
`insertFixturesSet` inlines a per-row `INSERT` builder instead of calling the
helper.

Note `schemaCache.columnsHash` is async in trails
(`packages/activerecord/src/connection-adapters/schema-cache.ts:258`) while
Rails' is synchronous, so `buildFixtureSql` and `buildFixtureStatements` become
`async` — their only production caller is `insertFixturesSet`, which is already
async, so the ripple is contained. The `.trails.test.ts` doubles that call
`buildFixtureSql` directly will need a `columns` / `lookupCastTypeFromColumn`
member on the host.

## Acceptance criteria

- [ ] `buildFixtureSql` takes its columns from the schema cache, rejecting
      virtual columns when `supportsVirtualColumns?` is true, matching
      database_statements.rb:609.
- [ ] A missing value comes from `this.defaultInsertValue(column)`, not a
      hardcoded `Arel.sql("DEFAULT")`; the single-row arm still drops the
      columns whose value is identically the abstract `DEFAULT_INSERT_VALUE`
      sentinel (database_statements.rb:632-640).
- [ ] Present values serialize through `lookupCastTypeFromColumn`, and unknown
      fixture columns raise `Fixture::FixtureError` with Rails' message.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green with
      `insertFixturesSet` delegating to `buildFixtureStatements`.
- [ ] Unblocks `insert-fixtures-set-inlines-build-fixture-statements`.
