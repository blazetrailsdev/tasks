---
title: "migration-compatibility-v7-0-rename-table-options"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced porting `Migration::Compatibility::V7_0` for
`migration-compatibility-v6-1-for-pre-rails-7-dump-tests`.

Rails `V7_0#rename_table`
(`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:122-126`)
sets `options[:_uses_legacy_table_name] = true` and
`options[:_uses_legacy_index_name] = true` and calls `super`, which reaches the
adapter's `rename_table(table_name, new_name, **options)`
(`abstract/schema_statements.rb:524`, `postgresql/schema_statements.rb`,
`sqlite3_adapter.rb`, `abstract_mysql_adapter.rb`), where the options drive the
legacy index-rename arm (`rename_table_indexes`) and the prefix/suffix handling.

In trails every adapter's `renameTable` is `(tableName, newName)` with no
options (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
`postgresql-adapter.ts`, `sqlite3-adapter.ts`, `abstract-mysql-adapter.ts`), and
so is the `Migration#renameTable` forwarder (`packages/activerecord/src/migration.ts`).
`V7_0` in `packages/activerecord/src/migration/compatibility.ts` therefore ports
every other override but not `renameTable`: it has nothing to hand the options to.

## Acceptance criteria

- [ ] `renameTable` takes Rails' `**options` on the adapters and the migration
      forwarder, and the options reach `rename_table_indexes` as in Rails.
- [ ] `Compatibility::V7_0#renameTable` is ported, setting both legacy flags.
- [ ] `pnpm parity:api:calls` / `:calls:args` clean; mixin-declaration-drift green.
