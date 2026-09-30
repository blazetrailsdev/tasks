---
title: "AR migration .tt templates carry Rails' per-attribute body instead of calling invented builders"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

Rails' AR migration templates carry the whole body. `create_table_migration.rb.tt`
and `migration.rb.tt`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/templates/`)
loop over `attributes` themselves, branching on `password_digest?` / `token?` /
`reference?` / `virtual?` / `has_index?`, and call the generator's private
helpers through the ERB binding: `primary_key_type` / `foreign_key_type`
(`active_record/migration.rb:20-28`), `attributes_with_index`
(`migration_generator.rb:69`), `migration_action`, `join_tables`, `table_name`,
`options[:timestamps]`.

Since trails#8269, `packages/trailties/src/generators/active-record/migration/templates/{migration,create_table_migration}.ts.tt`
are found through `find_in_source_paths` and rendered by `compileJs`, but they
are skeletons: each one calls a single invented builder,
`MigrationGenerator#migration()` / `#createTableMigration()`
(`packages/trailties/src/generators/migration-generator.ts`, `protected`). Those
builders hold the per-attribute branches, plus module helpers `kwargs()` /
`indexNameLiteral()` that have no Rails counterpart.

## Acceptance criteria

- Both `.ts.tt` templates carry Rails' per-attribute branches in Rails' order,
  as TSE (`<% for (const attribute of this.attributes) { -%>` …), reading the
  generator's own readers and helpers through the binding, as the `.rb.tt` do.
- `migration()` and `createTableMigration()` are deleted. `kwargs` /
  `indexNameLiteral` are deleted, or folded into whatever TS spelling of
  `inject_options` / `inject_index_options` `GeneratedAttribute` returns.
- Generated output is unchanged: `migration-generator.test.ts` snapshots and
  assertions stay green without edits.
