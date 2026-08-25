---
title: "SQLite alter_table's caller pushes reflected FKs instead of stripping affixes and calling definition.foreign_key"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5810
claim: "2026-08-01T18:27:00Z"
assignee: "sqlite-alter-table-caller-bypasses-definition-foreign-key"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `alterTable`'s second `move_table` onto the buffer
re-reflection (PR #5797).

Rails' `alter_table` caller lambda does not push reflected
`ForeignKeyDefinition` objects onto the definition. It strips the configured
table-name prefix/suffix off the reflected `to_table` and then routes through
the definition's own builder:

```ruby
to_table = strip_table_name_prefix_and_suffix(fk.to_table)
definition.foreign_key(to_table, **fk.options)
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:573-575`)

trails' `caller` closure instead pushes the reflected FK objects straight into
`definition.foreignKeys`, with `fk.toTable` carried across verbatim and
`TableDefinition#foreignKey` never invoked
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the
`caller` closure in `alterTable`).

Two consequences:

- With a non-empty `tableNamePrefix` / `tableNameSuffix`, the reflected
  `toTable` is the physical (prefixed) name. Rails strips it so
  `definition.foreign_key` can re-apply the affixes; trails keeps the physical
  name, so any affixing `foreignKey` does is skipped. `addForeignKey` already
  strips here (`sqlite-add-foreign-key-strips-table-name-prefix`, done) — the
  rebuild path was missed.
- Bypassing `definition.foreignKey` skips whatever normalisation/defaulting
  that builder applies, so a rebuilt table's FK can differ from one declared
  through `create_table`.

## Acceptance criteria

- [ ] The `alter_table` caller strips the table-name prefix/suffix off the
      reflected `toTable` per `sqlite3_adapter.rb:573-575`.
- [ ] FKs are added through `definition.foreignKey(...)` rather than pushed
      onto `definition.foreignKeys` directly, or the direct push is justified
      at the call site with the Rails-equivalence argument.
- [ ] A test covers a rebuild (e.g. `removeColumn`) on a table with a
      configured `tableNamePrefix` and asserts the FK survives pointing at the
      right table.
- [ ] `adapters/sqlite3/`, `migration/foreign-key.test.ts` green.
