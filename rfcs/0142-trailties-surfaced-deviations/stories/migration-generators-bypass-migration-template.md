---
title: "Migration generators write via createFile and branch on revoke instead of migration_template/CreateMigration"
status: draft
updated: 2026-09-26
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

Rails' migration generators write through `migration_template`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/migration_generator.rb:17`,
`model/model_generator.rb:28`). That calls `create_migration`
(`railties/lib/rails/generators/migration.rb:35-60`), which runs
`action CreateMigration.new(...)`, and Thor's `action` dispatches `invoke!` or `revoke!` on
`behavior`.

trails has two `MigrationGenerator`s:

- `packages/trailties/src/generators/migration-generator.ts`
- `packages/trailties/src/generators/rails/migration/migration-generator.ts`

Both write with `createFile` under a freshly computed timestamp. Since trails#8156, each has
a hand-written `if (this.behavior === "revoke") new CreateMigration(...).revoke()` arm in
place of the action dispatch. The invoke side therefore never reaches
`CreateMigration#invoke`'s conflict handling. A second generate of the same migration writes
a duplicate instead of raising "Another migration is already named …" or honouring
`--force` / `--skip`.

## Converged shape

Both generators call the existing `migrationTemplate` / `createMigration`
(`packages/trailties/src/generators/migration.ts`), which dispatches on `behavior` the way
Thor's `action` does. The per-generator revoke branch is deleted.

## Acceptance criteria

- No `behavior === "revoke"` branch remains in either migration generator.
- `model_generator_test.rb`'s `migration is skipped with skip option`,
  `migration is ignored as identical with skip option` and
  `existing migration is removed on force` port and pass.
