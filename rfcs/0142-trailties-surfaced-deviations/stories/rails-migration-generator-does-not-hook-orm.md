---
title: "rails-migration-generator-does-not-hook-orm"
status: draft
updated: 2026-09-29
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

Rails' `Rails::Generators::MigrationGenerator`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/migration/migration_generator.rb:7`)
is a `NamedBase` whose only job is `hook_for :orm, required: true`: `rails g migration`
resolves `rails:migration`, which invokes `active_record:migration`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/migration_generator.rb`)
to write the file.

trails has two unrelated classes instead:

- `packages/trailties/src/generators/rails/migration/migration-generator.ts` (namespace
  `rails:migration`) writes an empty `change()` itself and has no `hookFor("orm")`.
- `packages/trailties/src/generators/migration-generator.ts` is the one that actually
  builds columns (the `active_record:migration` body), and is constructed directly by
  `commands/generate.ts`'s `migration` subcommand and by
  `AuthenticationGenerator#runPendingGenerators`.

So `Generators.invoke("migration", args, config)` — what Rails' `Actions#generate`
(`railties/lib/rails/generators/actions.rb`, `def generate`) reaches through `rails generate` —
finds `rails:migration` and emits a migration with no columns. `runPendingGenerators`
therefore still names `MigrationGenerator.start` directly instead of dispatching by namespace.

## Acceptance criteria

- `rails:migration` declares `hook_for :orm, required: true` and no longer writes a file itself.
- The column-building generator is the `active_record:migration` namespace the hook resolves.
- `AuthenticationGenerator#runPendingGenerators` and the `generate migration` CLI subcommand
  dispatch through `Generators.invoke(namespace, args, config)`; neither names a
  `MigrationGenerator` class.
