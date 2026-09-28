---
title: "AuthenticationGenerator hand-parses --force instead of dispatching pending generators through generate"
status: claimed
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 6
pr: null
claim: "2026-09-28T17:56:44Z"
assignee: "generated-ci-and-manifest-run-eslint-not-rubocop"
blocked-by: null
closed-reason: null
---

## Context

trails#8201 made migrations do real conflict detection (`CreateMigration#invoke` → `on_conflict_behavior`).
`AuthenticationGenerator#runPendingGenerators`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`) replays each queued
`generate("migration ... --force")` by constructing `MigrationGenerator` directly. It forwards `--force`
by hand-checking `words.includes("--force")`.

Rails: `Rails::Generators::Actions#generate`
(`railties/lib/rails/generators/actions.rb`, `def generate(what, *args)`) runs the generator through
`rails generate` in-process (`run_ruby_script` / `Rails::Command.invoke`). Thor then parses `--force` as the
runtime class option added by `add_runtime_options!`. The option is not string-matched at the call site.

## Converged shape

- Pending generators dispatch through `Generators.invoke(namespace, args, config)`, whose `start` parses class
  options, or through the trails port of `Actions#generate`.
- `force` / `skip` / `pretend` are runtime class options on `GeneratorBase`, as Thor's
  `add_runtime_options!` declares them.
- The `words.includes("--force")` check is deleted.

## Acceptance criteria

- No hand-parsed `--force` remains in `authentication-generator.ts`.
- Re-running the authentication generator still replaces `create_users` / `create_sessions` without a conflict error.
