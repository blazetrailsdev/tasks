---
title: "Database configuration: add Rails' config/database.yml arm; receipt the .ts/.js/.json arms"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["trailties", "activerecord"]
deps: ["configuration-file-parse-through-psych-unsafe-load"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails reads only `config/database.yml`: `paths.add "config/database", with:
"config/database.yml"` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:399`),
`load_database_yaml` (`:416-431`, through `DummyConfig`) and
`database_configuration` (`:434-469`, `ActiveSupport::ConfigurationFile.parse`
plus the `shared` reverse-merge, the `DATABASE_URL` arm and the
"Could not load database configuration. No such file - …" raise).
`DatabaseTasks.setup_initial_database_yaml`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:135-141`) calls
`load_database_yaml`.

trails (`packages/trailties/src/database.ts:99-160`) reads `config/database.ts`
/ `.js` (a module) or `config/database.json`, and never `.yml`. `trails new`
generates `config/database.ts`
(`packages/trailties/src/generators/app-generator.ts:1377-1379`). The TS/JSON
arms are the YAML-free alternative (RFC matrix) and stay.

## Acceptance criteria

- [ ] `config/database.yml`, when present, is read through
      `ConfigurationFile.parse` (TSE-rendered), taking precedence per RFC Q4,
      with the `shared` merge and error message ported from `:438-468`.
- [ ] The `.ts` / `.js` / `.json` arms carry `@noRailsEquivalent PERMANENT`
      receipts, or a pointer to this RFC if they are already receipted.
- [ ] `setupInitialDatabaseYaml` reaches the same loader.
- [ ] Tests cover a `database.yml` with `<<: *default` and a `shared` block,
      and the YAML-free `.ts` path with `yaml` unresolvable.

## Verification

`pnpm vitest run packages/trailties/src/database*.test.ts packages/trailties/src/application/configuration.test.ts`.
