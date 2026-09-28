---
title: "Thor's behavior: :skip is unported on GeneratorBase"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GeneratorOptions.behavior` in `packages/trailties/src/generators/base.ts` is `"invoke" | "revoke"`. Thor's
third behavior, `:skip`, is unported. So `model_generator_test.rb:344-348`
(`test_migration_is_skipped_on_skip_behavior`: `run_generator ["Account"], behavior: :skip` asserts
`skip db/migrate/..._create_accounts`) stays `it.skip` in
`packages/trailties/src/generators/model-generator.test.ts`.

Rails / Thor: `Thor::Actions#initialize` maps `behavior: :skip` to `options[:skip] = true` and invokes
(thor `lib/thor/actions.rb`, not vendored). `CreateMigration#on_conflict_behavior`
(`railties/lib/rails/generators/actions/create_migration.rb`) then reports `skip`.

## Converged shape

- `behavior` accepts `"skip"`. The `GeneratorBase` constructor normalizes it the way Thor does: invoke, with
  `options.skip` set.

## Acceptance criteria

- `migration is skipped on skip behavior` ports and passes.
