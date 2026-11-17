---
title: "trailties: database.yml templates add Solid cache/queue/cable production databases"
status: in-progress
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10215
claim: "2026-11-16T22:51:35Z"
assignee: "app-database-yml-templates-add-solid-databases"
blocked-by: null
closed-reason: null
---

## Context

Rails' `config/databases/{sqlite3,postgresql,mysql}.yml.tt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/databases/sqlite3.yml.tt`)
emit production `primary` / `cache` / `queue` / `cable` databases (with `migrations_paths: db/<name>_migrate`)
unless `skip_solid?`. trails' templates at
`packages/trailties/lib/generators/trails/app/templates/config/databases/*.yml.tt` mention none of them, so a
generated app's production config cannot reach the schemas the Solid install generators write.
Rails covers it in `test_configuration_of_solid` (`railties/test/generators/app_generator_test.rb:661-674`).

## Acceptance criteria

- Each database template emits Rails' multi-database production block under the `skip_solid?` guard.
- Port `test_configuration_of_solid` as "configuration of solid" in `packages/trailties/test/generators/app-generator.test.ts`,
  reusing `runGeneratorInstance`.
