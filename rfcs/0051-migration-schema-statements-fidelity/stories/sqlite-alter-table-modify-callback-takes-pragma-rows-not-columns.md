---
title: "SQLite alterTable feeds raw PRAGMA rows to its modify callback instead of Rails' columns(from)"
status: in-progress
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5528
claim: "2026-07-28T18:13:48Z"
assignee: "sqlite-alter-table-modify-callback-takes-pragma-rows-not-columns"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `sqlite-alter-table-hand-rolls-fk-sql-instead-of-schema-creation`
(PR #5487).

Rails' `copy_table` reflects the source with `columns(from)` and feeds real
`Column` objects into the definition, reading `column.limit`, `precision`,
`scale`, `null`, `collation`, `virtual?`, `virtual_stored?`,
`has_default?`, `default_function` and `auto_increment?`, and deserializing
the default through `lookup_cast_type_from_column`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:597-640`).

trails' `alterTable` instead hands its `modify` callback a record of raw
PRAGMA rows — `{ type, notnull, dflt_value, pk, collation, generatedAs, ... }`
where `type` is the declared SQL type text and `dflt_value` is an
already-quoted SQL literal
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2416-2430`).
Every caller (`addColumn`, `removeColumn`, `changeColumn`,
`changeColumnDefault`, `changeColumnNull`, `renameColumn`) is written against
that pragma shape, quoting its own defaults via `quoteDefault` /
`serializeDefaultForColumn` before storing them.

Consequences: the definition built in #5487 has to pin `sqlType` rather than
resolve it through `typeToSql`, and has to smuggle the pre-quoted default
through as a callable — both deviations that exist only because the input is
pragma-shaped rather than `Column`-shaped. It is also what makes the
`primary_key` pseudo-type flip hazardous (fixed in #5487 by guarding the pin).

Converging means switching the rebuild to `columns(from)` and rewriting the
six callers to mutate AR-typed column state, which is why it was out of scope
for #5487.

## Acceptance criteria

- [ ] The rebuild reflects the source through `columns(tableName)` and builds
      the definition from `Column` objects, mirroring `copy_table`.
- [ ] Defaults reach the definition as values deserialized through the
      column's cast type, so `schemaCreation` quotes them once, and the
      callable-default smuggling is gone.
- [ ] The `sqlType` pin is removed or reduced to the cases Rails also pins.
- [ ] The six `alterTable` callers are updated in step.
- [ ] Green on all three adapters, in particular `sqlite3-copy-table.test.ts`,
      `adapters/sqlite3/`, `migration/foreign-key.test.ts`,
      `schema-dumper.test.ts`.
