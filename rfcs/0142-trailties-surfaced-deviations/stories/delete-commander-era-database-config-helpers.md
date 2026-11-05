---
title: "Delete commander-era database config helpers orphaned by the db:* rake move"
status: draft
updated: 2026-11-05
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9744 deleted `packages/trailties/src/commands/db.ts`, so every `db:*` task now runs from `packages/activerecord/src/trailties/databases.ts` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake`). The commander-era helpers in `packages/trailties/src/database.ts` no longer have any non-test caller: `loadDatabaseConfigModule` (:46), `loadDatabaseConfig` (:150), `loadAllDatabaseConfigs` (:201), `resolveSchemaFormat` (:243) and `connectAdapter` (:283). Their only remaining users are the `resolveSchemaFormat`, `loadDatabaseConfig`, `loadAllDatabaseConfigs` and `connectAdapter` describes in `packages/trailties/src/commands/db.test.ts`. None of them has a Rails counterpart. Rails reads its configuration through `Rails::Application::Configuration#database_configuration` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb`), which trails ports as `databaseConfiguration` (:100). The schema format comes from `ActiveRecord.schema_format` / `ENV["SCHEMA_FORMAT"]` (`databases.rake:452`).

## Acceptance criteria

- Delete the five helpers and their `db.test.ts` describes, or show a live caller for any helper that stays.
- `databaseConfiguration` and `resolveEnv` stay; `trails.ts`, `engine/configuration.ts`, `dbconsole.ts` and `trailties/active-record.ts` use them.
- `pnpm parity:api:extra --package trailties` shows the extra surface shrinking.
