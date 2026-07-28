---
title: "SQLite foreignKeys synthesizes a name Rails' PRAGMA path never sets"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
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

trails' SQLite `foreignKeys` parses the `CREATE TABLE` DDL and recovers the real
`CONSTRAINT` name, then falls back to a synthesized `fk_<table>_<cols>` when the
DDL carries none (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`,
the `_parseForeignKeyNames` path). Rails' SQLite `foreign_keys` reads only
`PRAGMA foreign_key_list` and never sets `:name` at all
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:417-451`).

Surfaced by #5453: Rails' `test_schema_dumping_with_options` asserts the dumped
line carries no `name:` on SQLite and does carry `name: "fk_name"` elsewhere.
Because trails recovers the name, the dump emits it on every adapter, so the
ported case had to collapse the adapter branch to a single assertion (justified
at the call site in `packages/activerecord/src/migration/foreign-key.test.ts`).

Coupled second-order gap in the same cluster: Rails'
`ForeignKeyDefinition#export_name_on_schema_dump?` is
`!fk_ignore_pattern.match?(name) if name` — it returns nil when `name` is nil
(`schema_definitions.rb:157-159`). trails' `isExportNameOnSchemaDump` getter
(`connection-adapters/abstract/schema-definitions.ts`) has no `if name` guard,
so a nil name yields `true`. No visible bug today only because the dumper's
call site re-guards with `if (exportName && fk.name)`; any other caller would
see the divergence. `CheckConstraintDefinition#export_name_on_schema_dump?`
(`schema_definitions.rb:185-187`) has the same shape and should be checked too.

## Acceptance criteria

- [ ] Decide and record whether the synthesized/DDL-recovered SQLite FK name is
      a deviation to remove or an enhancement to keep; if kept, the reason lives
      at the source, not only in the test.
- [ ] `isExportNameOnSchemaDump` mirrors Rails' `if name` guard (nil name yields
      a falsy result, not `true`), for both the FK and check-constraint
      definitions.
- [ ] If the SQLite name is removed, `migration/foreign-key.test.ts`'s
      `schema dumping with options` restores Rails' `current_adapter?(:SQLite3Adapter)`
      branch instead of the collapsed single assertion.
- [ ] Green on all three adapters.
