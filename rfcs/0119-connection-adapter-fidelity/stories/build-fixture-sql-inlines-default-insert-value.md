---
title: "build-fixture-sql-inlines-default-insert-value"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: "2026-09-05T19:26:47Z"
assignee: "port-actionview-cache-helper"
blocked-by: null
closed-reason: null
---

# build_fixture_sql inlines DEFAULT instead of calling default_insert_value, leaving every adapter override dead

## Context

Surfaced on PR #7280, which wired `defaultInsertValue` onto `SQLite3Adapter` as
part of deduplicating the sqlite3 `DatabaseStatements` — and found the method has
**no caller anywhere in the repo**.

Rails calls it from `build_fixture_sql`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:607-626`):

```ruby
columns.map do |name, column|
  if fixture.key?(name)
    type = lookup_cast_type_from_column(column)
    with_yaml_fallback(type.serialize(fixture[name]))
  else
    default_insert_value(column)
  end
end
```

so the per-adapter overrides actually decide what an absent fixture column
inserts. Two exist and both are currently unreachable in trails:

- `sqlite3/database_statements.rb:139-145` — `Arel.sql(column.default_function)`
  if there is one, else `column.default`
  (`connection-adapters/sqlite3/database-statements.ts:296`)
- `mysql/database_statements.rb` — the auto-increment arm
  (`connection-adapters/mysql/database-statements.ts:79`)

trails' `buildFixtureSql`
(`connection-adapters/abstract/database-statements.ts:1227-1252`) hardcodes

```ts
const DEFAULT_VALUE = arelSql("DEFAULT");
...
col in fixture ? arelSql(this.quote(withYamlFallback(fixture[col]))) : DEFAULT_VALUE,
```

which is the abstract `DEFAULT_INSERT_VALUE` (`database_statements.rb:603-605`)
inlined, so sqlite3 fixtures with a `default_function` column get a literal
`DEFAULT` where Rails inserts the function, and the MySQL auto-increment arm
never runs.

Two adjacent deviations in the same body, worth converging together since the
fix touches the same loop:

- **Column source.** Rails iterates `schema_cache.columns_hash(table_name)`
  (minus virtual columns); trails iterates the union of the _fixtures'_ own keys
  (`:1238`). A column absent from every fixture row is therefore never emitted
  at all, which is why the missing `default_insert_value` call has stayed
  invisible.
- **Unknown-column check.** Rails raises `Fixture::FixtureError` naming the
  unknown columns (`:614-616`); trails has no such arm.

## Converged shape

Drive the loop from `schema_cache.columns_hash(tableName)` with the
`supports_virtual_columns? && column.virtual?` reject, restore the
unknown-columns `FixtureError`, and call `this.defaultInsertValue(column)` in
the else arm so the sqlite3 and mysql overrides come alive. `defaultInsertValue`
is already wired onto `SQLite3Adapter.prototype` (#7280) and exported from the
mysql file, so this is the call site, not the definitions.

## Acceptance criteria

- [ ] `buildFixtureSql` calls `defaultInsertValue(column)` for a column the
      fixture omits; the sqlite3 `default_function` arm and the mysql
      auto-increment arm are both exercised by a test.
- [ ] Columns come from the schema cache, not from the fixture keys, with the
      virtual-column reject.
- [ ] An unknown fixture column raises `FixtureError` with Rails' message.
- [ ] `pnpm parity:api:calls` loses the corresponding row rather than gaining a
      baseline entry.
