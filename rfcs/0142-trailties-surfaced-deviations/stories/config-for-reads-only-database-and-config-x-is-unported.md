---
title: "configFor reads only config/database and config.x is unported, so apps read settings straight from env"
status: in-progress
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: 4
pr: trails#8112
claim: "2026-09-25T22:02:05Z"
assignee: "assertions-has-many-associations-remainder-13"
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. trailmap reads its own settings
straight out of the environment, in three hand-rolled modules:

- `config/fleet.ts:33-58`: `FLEET_REPO_PATHS` and `RINGO_EVENTS_URL`, parsed
  from `env`.
- `config/tasks-content.ts:21-29`: `TASKS_DIR` / `TASKS_DATABASE`.
- `config/database.ts:47-61`: `tasksDatabaseConfig()` / `hasTasksDatabase()`
  over `env.TASKS_DATABASE`.

A Rails app puts application settings in `config/<name>.yml` read through
`Rails.application.config_for(:name)`, or on `config.x.<name>`. Neither exists
in trails:

- `Application#configFor` (`packages/trailties/src/application.ts:243-248`)
  throws for any name but `"database"`:
  `configFor: only "database" is supported in trailties`. Rails' `config_for`
  (`railties/lib/rails/application.rb:288-313`) reads any
  `config/<name>.yml`, selects the env key, deep-merges `shared:`, and returns
  `OrderedOptions`.
- `config.x` is unported. Rails'
  `Rails::Application::Configuration#initialize` sets `@x = Custom.new`
  (`railties/lib/rails/application/configuration.rb:70`), and `Custom`
  (`:601`) is a `method_missing` namespace of `OrderedOptions`. Nothing in
  `packages/trailties/src/application/configuration.ts` corresponds to it.

## Acceptance criteria

- `configFor(name)` reads `config/<name>.{ts,js}` (the trails spelling of the
  `.yml`, as `config/database.ts` already is), selects the current env's key,
  deep-merges `shared`, and returns an `OrderedOptions`. It mirrors
  `application.rb:288-313`, including the "Could not load configuration. No such
  file" raise.
- `config.x` exists and behaves as Rails' `Custom` (`configuration.rb:601`):
  `config.x.fleet.repoPaths = ...` then reads back, and an unset namespace reads
  as an empty `OrderedOptions`. Use the trails `method_missing` idiom that
  `ordered_options` already uses (a Proxy, per CLAUDE.md's per-class table).
- Tests mirror the `config_for` cases in
  `railties/test/application/configuration_test.rb`.
