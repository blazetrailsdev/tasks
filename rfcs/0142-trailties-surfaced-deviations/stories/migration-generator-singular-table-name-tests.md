---
title: "Port the three migration generator singular-table-name tests"
status: in-progress
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 7
pr: trails#8250
claim: "2026-09-29T19:05:03Z"
assignee: "scaffold-controller-fails-trails-tsc-on-a-fresh-app"
blocked-by: null
closed-reason: null
---

## Context

trails#8198 ported `pluralize_table_names?` into `MigrationGenerator`
(`packages/trailties/src/generators/migration-generator.ts`, the private
`isPluralizeTableNames()` read of `Base.pluralizeTableNames`). It is used by
`normalizeTableName` and the join arm's `plural_name` / `singular_name` choice,
mirroring `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/migration_generator.rb:35,71-73`
and `railties/lib/rails/generators/named_base.rb` (`pluralize_table_names?`).
The three Rails tests that exercise the singular arm are still `it.skip` in
`packages/trailties/src/generators/migration-generator.test.ts`:

- "migration with singular table name" (`railties/test/generators/migration_generator_test.rb:345-355`)
- "create join table migration with singular table name" (`:357-370`)
- "create table migration with singular table name" (`:372-383`)

Each wraps its body in `with_singular_table_name`
(`railties/test/generators/generators_test_helper.rb`), which sets
`ActiveRecord::Base.pluralize_table_names = false` and restores it in an `ensure`.

## Acceptance criteria

- The three tests are ported with Rails' names and assertions, in TS migration
  syntax: `addColumn("post", "title", "string")`, `createJoinTable("artist", "music"`,
  `createTable("book"`.
- A `withSingularTableName` helper sets and restores `Base.pluralizeTableNames`
  as Rails' does, placed where trails' generator test helpers live.
