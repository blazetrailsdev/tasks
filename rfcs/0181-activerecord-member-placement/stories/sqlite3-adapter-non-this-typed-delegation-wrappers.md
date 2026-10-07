---
title: "sqlite3-adapter.ts: replace the remaining non-this-typed delegation wrappers with the mixin functions"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8638 replaced the `SQLite3Adapter` class-body wrappers of the shape `foo(...) { return sqliteFoo.call(this, ...) }` with the mixin functions themselves on `SQLite3Adapter.prototype`. A second group of wrappers remains in `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, over functions that are not `this`-typed, so they were outside that story's `.call(this, ...)` criterion:

- `quoteString`, `quoteTableNameForAssignment`, `quotedTrue`, `quotedFalse`, `unquotedTrue`, `unquotedFalse`, `quotedBinary` over `sqlite3/quoting.ts` (Rails: `activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb`).
- `returningColumnValues` and `castResult` over `sqlite3/database-statements.ts` (Rails: `sqlite3/database_statements.rb`).
- `indexes(tableName)`, which calls `sqliteIndexes(this, tableName)`: the mixin function in `sqlite3/schema-statements.ts` takes the adapter as its first parameter where Rails' `indexes(table_name)` (`sqlite3/schema_statements.rb:9`) is an instance method.
- `static quoteColumnName` / `static quoteTableName`, over the `Quoting::ClassMethods` functions in `sqlite3/quoting.ts`.

Rails defines each once in the module file and `SQLite3Adapter` only includes the modules (`sqlite3_adapter.rb`). CLAUDE.md "Module mixins" forbids delegation wrappers.

## Acceptance criteria

- [ ] None of the methods above is a class-body wrapper in `sqlite3-adapter.ts`; each is the mixin function on the prototype (or the class, for the two statics) with a bodiless interface declaration.
- [ ] `indexes` in `sqlite3/schema-statements.ts` is `this`-typed and takes `tableName` as its only parameter.
- [ ] `scripts/mixin-declaration-drift.test.ts` passes and `pnpm parity:api:pins` is clean.
- [ ] SQLite adapter tests are green.
