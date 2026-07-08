---
title: "columnexists-type-and-options-matching"
status: ready
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

Follow-up from Codex review of PR #4774
(collapse-migrationcontext-introspection-onto-adapter-remaining). Rails'
`column_exists?(table_name, column_name, type = nil, **options)` matches not
just the name but optionally the column `type` and the `column_options_keys`
(limit/default/null/precision/scale) —
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:132-141`.

trails' `SchemaStatements#columnExists`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:616`)
is name-only, and both `Migration#columnExists`
(`packages/activerecord/src/migration.ts:574`) and
`MigrationContext#columnExists` mirror that narrow surface. Because the
adapter itself does not implement the type/options matching, forwarding those
args from MigrationContext would be a silently-ignored no-op — the fix belongs
at the adapter (`SchemaStatements`) layer first, then Migration /
MigrationContext forward.

## Acceptance criteria

- [ ] `SchemaStatements#columnExists` accepts `type = null` and
      `**options` (limit/default/null/precision/scale) and matches them in
      Ruby-style against `columns(table)`, per Rails `column_exists?`.
- [ ] `Migration#columnExists` and `MigrationContext#columnExists` expose and
      forward the full `(table, column, type?, options?)` signature.
- [ ] Tests ported from Rails' `column_exists?` type/options cases.
- [ ] Test names match Rails verbatim.
