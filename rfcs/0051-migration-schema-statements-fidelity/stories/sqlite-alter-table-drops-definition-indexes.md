---
title: "SQLite alterTable drops indexes added to the definition in-block"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `copy_table` builds the destination through `create_table`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:599`),
and `create_table` emits the definition's pending indexes after the CREATE:

```ruby
td.indexes.each do |column_name, index_options|
  add_index(table_name, column_name, **index_options, if_not_exists: td.if_not_exists)
end
```

(`abstract/schema_statements.rb:312-313`.)

trails' `alterTable` instead renders the definition with
`schemaCreation.accept(definition)` and then restores indexes with
`copyTableIndexes(alteredTableName, tableName)`, which reflects them off the
buffer table (`connection-adapters/sqlite3-adapter.ts`, `alterTable`). Indexes
that exist on the source survive, because the buffer carries them — but any
index added to the definition _inside the alterTable block_ is silently
dropped: `definition.indexes` is never read anywhere in the adapter.

The reachable caller is `addColumn(table, col, type, { index: true })` when
`isInvalidAlterTableType` routes it through the rebuild (a `primary_key`
column, or any type SQLite cannot `ALTER TABLE ADD`). `TableDefinition#column`
pushes to `this.indexes`, and nothing ever emits it.

Found while porting the `alterTable` rebuild to `columns()` (#5528); pre-existing,
so it was out of scope there.

## Acceptance criteria

- [ ] An index registered on the definition inside the `alterTable` block is
      created on the rebuilt table, mirroring `create_table`'s `td.indexes` loop.
- [ ] `addColumn(t, c, "primary_key", { index: true })` (and the non-PK
      invalid-alter types) creates the index.
- [ ] Indexes reflected from the source table still round-trip — no double
      creation with `copyTableIndexes`.
- [ ] Green on all three adapters, in particular `adapters/sqlite3/`,
      `sqlite3-introspection.test.ts`, `migration/`.
