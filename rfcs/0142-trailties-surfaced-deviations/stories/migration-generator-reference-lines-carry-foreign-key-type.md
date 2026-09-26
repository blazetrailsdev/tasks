---
title: "migration-generator-reference-lines-carry-foreign-key-type"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `ActiveRecord::Generators::Migration#foreign_key_type`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration.rb:25-28`) returns
`", type: :#{key_type}"` when `options[:primary_key_type]` is set. The templates append it after
`inject_options` on every reference line: `t.<type>` in `create_table_migration.rb.tt`, and
`add_reference` / `remove_reference` / `t.references` in `migration.rb.tt`.

trails' `packages/trailties/src/generators/migration-generator.ts` (after trails#8147) applies
`primaryKeyType` only to the table's own `id` (`idOpt` in the create arm), and `MigrationGenerator#run`
accepts `primaryKeyType` only through `ModelGenerator`. Reference columns never get
`type: "<primaryKeyType>"`. The Rails tests
"remove migration with references removes foreign keys when primary key uuid" and its add/create
siblings (`railties/test/generators/migration_generator_test.rb:140-149`) are `it.skip` in
`packages/trailties/src/generators/migration-generator.test.ts`.

## Acceptance criteria

- `MigrationGenerator` takes `primaryKeyType` for every arm and emits Rails' `foreign_key_type`
  after `injectOptions()` on each reference line, in template position.
- The skipped `... when primary key uuid` Rails tests are ported and pass.
