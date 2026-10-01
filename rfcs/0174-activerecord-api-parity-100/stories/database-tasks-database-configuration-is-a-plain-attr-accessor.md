---
title: "database-tasks-database-configuration-is-a-plain-attr-accessor"
status: ready
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
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

Rails' `DatabaseTasks.database_configuration` is a plain `attr_accessor`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:61`), independent of
`ActiveRecord::Base.configurations`. The two are joined only by the `load_config` rake task:
`ActiveRecord::Base.configurations = ActiveRecord::Tasks::DatabaseTasks.database_configuration`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake:24`).

trails' `DatabaseTasks.databaseConfiguration` (`packages/activerecord/src/tasks/database-tasks.ts:53-59`)
is a getter/setter pair that reads and writes `ActiveRecord.Base.configurations` itself, and a
`null` write resets it to an empty `DatabaseConfigurations`. So assigning it changes what
`Base.configurations` answers, which Rails' accessor never does.
`activerecord-converge-configuration-and-connection-convergeable-receipts` removed the
`configurationsStore` / `setConfigurationsStore` free functions it was written over and routed it
through the Rails accessor, but left the coupling.

Callers that rely on the coupling: `packages/activerecord-cli/src/db-helpers.ts:15`
(`loadDatabaseConfig`, the `load_config` analogue), `packages/activerecord/src/support/connection.ts:177-178`,
and the `DatabaseTasks.databaseConfiguration = null` teardown in ~15 test files
(`grep -rn 'databaseConfiguration = ' packages`).

## Acceptance criteria

- [ ] `databaseConfiguration` is a plain accessor over its own field, as `attr_accessor` is.
- [ ] `loadDatabaseConfig` assigns `Base.configurations` from it, as `databases.rake:24` does, and
      each test that relied on the coupling sets `Base.configurations` itself.
- [ ] `pnpm vitest run packages/activerecord/src/tasks packages/activerecord-cli` green.
