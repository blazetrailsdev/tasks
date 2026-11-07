---
title: "port-setup-initial-database-yaml-for-per-database-rake-tasks"
status: done
updated: 2026-11-07
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9812
claim: "2026-11-06T23:47:05Z"
assignee: "port-setup-initial-database-yaml-for-per-database-rake-tasks"
blocked-by: null
closed-reason: null
---

# Port setup_initial_database_yaml so per-database db:\* rake tasks are generated

## Context

`databases.rake:7` reads `databases = ActiveRecord::Tasks::DatabaseTasks.setup_initial_database_yaml`,
which is `Rails.application.config.load_database_yaml`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:135-139`,
`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:415-429`, parsing
`config/database` under a `DummyConfig`). Every `DatabaseTasks.for_each(databases)` loop in
`packages/activerecord/src/trailties/databases.ts` (`db:create:<name>`, `db:migrate:<name>`,
`db:rollback:<name>`, `db:migrate:up/down/redo/status:<name>`, `db:version:<name>`,
`db:schema:dump:<name>`, `db:_dump:<name>`) is ported, but trails'
`setupInitialDatabaseYaml` (`packages/activerecord/src/tasks/database-tasks.ts:786`) returns `{}`,
so none of those tasks exist. trails' `config/database.ts` is loaded by an awaited `import()`,
so the load has to be an awaited step before the `.rake` body runs (databases.ts is loaded through
`rbFLoad`, outside the package root graph).

Four tests in `packages/trailties/src/commands/db.test.ts` are parked as `it.skip` on this story:
"db:rollback:namespace works", "db forward and db migrate:redo step the named database",
"db migrate --database=animals targets only the named DB" and
"db migrate respects migrationsPaths config override".

## Acceptance criteria

- [ ] `Configuration#loadDatabaseYaml` is ported (with `DummyConfig`) and
      `setupInitialDatabaseYaml` answers it.
- [ ] A multi-database app gets the per-database `db:*:<name>` tasks.
- [ ] The four parked tests run against `db:<task>:<name>` and pass.
