---
title: "TableDefinition raises an invented ArgumentError for primaryKey: []; Rails stores an empty PrimaryKeyDefinition"
status: done
updated: 2026-08-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6033
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TableDefinition`'s constructor
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1010-1012`)
raises `ArgumentError("primaryKey array must not be empty")` for
`primaryKey: []`. Rails has no such check: `set_primary_key`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:395-410`)
routes any Array to `primary_keys(pk)`
(`schema_definitions.rb:412-415`), which stores
`PrimaryKeyDefinition.new([])` — a definition the schema creation layer then
renders as no PRIMARY KEY clause. The message string is invented too: it has no
Rails counterpart, so no Rails test can pin it.

Surfaced while landing #5993 (converging `set_primary_key` onto Rails' single
guarded call); left in place there to keep the diff scoped.

## Converged shape

- Delete the empty-array guard; let `primaryKey: []` fall through to
  `primaryKeys(pk)` exactly as Rails does.
- Check the schema-creation path (`visitTableDefinition` / adapter
  `schema-creation.ts`) renders an empty `PrimaryKeyDefinition` as no PRIMARY
  KEY clause rather than emitting `PRIMARY KEY ()`.
- Drop/adjust any trails test asserting the invented ArgumentError.

## Acceptance criteria

- [ ] No empty-array check remains in `TableDefinition`'s constructor.
- [ ] `create_table t, primary_key: []` produces valid DDL on all three
      adapters.
