---
title: "activerecord: memoize arel_table and reset it where table_name= and reload_schema_from_cache do"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while converging `model-schema.ts` in trails PR 8524.

Rails memoizes the class's Arel table and drops the memo wherever the table name or the schema changes:

- `activerecord/lib/active_record/core.rb:391-393` — `@arel_table ||= Arel::Table.new(table_name, klass: self)`.
- `activerecord/lib/active_record/model_schema.rb:278-281` — `table_name=` sets `@table_name`, then `@arel_table = nil`, `@sequence_name = nil unless @explicit_sequence_name`, `@predicate_builder = nil`.
- `activerecord/lib/active_record/model_schema.rb:553-556` — `reload_schema_from_cache` sets `@arel_table = nil` second, after `@_returning_columns_for_insert`.

trails:

- `packages/activerecord/src/core.ts` `arelTable` returns `new Table(this.tableName, { klass: this })` on every read, with no memo.
- `packages/activerecord/src/model-schema.ts` `setTableName` has no `@arel_table = nil`, and writes `_schemaLoaded = false`, which Rails' writer does not (the `reset_column_information if connected?` arm above it is what resets the schema).
- `reloadSchemaFromCache` has no `@arel_table = nil`, and clears `_schemaLoadPromise`, a trails-only field.

Every `arelTable` read allocates a table, so two reads are never the same object, and the two reset sites differ from Rails' assignment lists.

## Converged shape

- `arelTable` is `ownMemo ?? (this._arelTable = new Table(tableName, { klass: this }))`, read through an own-property guard (CLAUDE.md § "`inherited` is deferred to own-property memo guards").
- `setTableName` assigns `_arelTable = null` in Rails' position and drops the `_schemaLoaded = false` write.
- `reloadSchemaFromCache` assigns `_arelTable = undefined` in Rails' position.

## Acceptance criteria

- [ ] `Model.arelTable === Model.arelTable`, and a `tableName=` or `reloadSchemaFromCache` yields a new one.
- [ ] `setTableName`'s assignments are Rails' four, in Rails' order, with no `_schemaLoaded` write.
- [ ] `pnpm parity:api:calls` and the arms report are unchanged or better for `core.ts` and `model-schema.ts`.
