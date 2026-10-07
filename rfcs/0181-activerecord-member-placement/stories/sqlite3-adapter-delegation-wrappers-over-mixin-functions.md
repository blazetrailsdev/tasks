---
title: "sqlite3-adapter.ts: replace class-body delegation wrappers with the mixin functions themselves"
status: done
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8638
claim: "2026-10-07T15:03:12Z"
assignee: "sqlite3-adapter-delegation-wrappers-over-mixin-functions"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` still carries about 16 class-body delegation wrappers over the `this`-typed functions its mixin files export, of the shape `foo(...) { return sqliteFoo.call(this, ...) }`. Examples at the time of trails#8583: `affectedRows`, `quote`, `quotedTime`, `typeCast`, `executeBatch`, `buildTruncateStatement`, `virtualTableExists`, `dataSourceSql`, `newColumnFromField`, `validTableDefinitionOptions`, `checkConstraints`, `addForeignKey`, `removeForeignKey`, `addCheckConstraint`, `removeCheckConstraint`. `createSchemaDumper` is worse: the adapter has its own body (`Sqlite3SchemaDumper.create(this, options)`) beside the mixin's exported `createSchemaDumper` in `sqlite3/schema-statements.ts`, so the mixin function is dead.

Rails defines each of these once, in the module file: `activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb` (`create_schema_dumper` :122, `valid_table_definition_options` :131, `new_column_from_field` :143, `data_source_sql` :181), `sqlite3/database_statements.rb` and `sqlite3/quoting.rb`. `SQLite3Adapter` only does `include SQLite3::Quoting / SQLite3::SchemaStatements / SQLite3::DatabaseStatements` (`sqlite3_adapter.rb`).

CLAUDE.md "Module mixins" forbids delegation wrappers. trails#8583 converted `schemaCreation` and `createTableDefinition` to the settled shape in this file: the mixin function assigned onto `SQLite3Adapter.prototype` (a getter through `Object.defineProperty`), with a bodiless declaration on `interface SQLite3Adapter`. `parity:api:moves` does not report the remaining wrappers because the body is already in the defining file.

## Acceptance criteria

- [ ] No method in the `SQLite3Adapter` class body is only a `.call(this, ...)` into a `sqlite3/*.ts` function; each is the function itself on the prototype (or reached through `include()`), with a bodiless interface declaration.
- [ ] The adapter's own `createSchemaDumper` body is gone and the mixin's is the one that runs.
- [ ] `scripts/mixin-declaration-drift.test.ts` passes; `pnpm parity:api:pins` is clean (prune pins keyed to `sqlite3_adapter.rb` that go stale).
- [ ] SQLite adapter tests are green.
