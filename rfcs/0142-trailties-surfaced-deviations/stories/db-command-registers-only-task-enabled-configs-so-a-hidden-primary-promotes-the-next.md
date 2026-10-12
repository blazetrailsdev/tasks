---
title: "trails db registers only databaseTasks configs, so a hidden primary makes the next database primary"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while attempting trailmap's `declare-the-tasks-database-in-config-database`
(blocked on this). Same root as `db-database-flag-loads-primary-schema`, a
second trigger: no `--database` flag is needed.

A multi-database environment whose FIRST database carries `databaseTasks: false`:

```ts
development: {
  primary: { adapter: "sqlite3", database: env.TASKS_DATABASE, databaseTasks: false },
  hub: { adapter: "postgresql", url: env.HUB_DATABASE_URL, migrationsPaths: "db/hub-migrate" },
}
```

`trails db migrate` then treats `hub` as the primary. Observed on trailmap@ae5cd69
(trails 58e3c64148): the hidden SQLite file is correctly untouched (sha unchanged),
but `db/schema.ts` is rewritten with the POSTGRES schema (`define<PostgreSQLAdapter>`,
owners/repositories tables), and on a fresh hub the task domain's `db/schema.ts`
would be loaded into Postgres.

Cause: `packages/trailties/src/commands/db.ts` (dist `commands/db.js:92`) filters
the environment's configs to `c.hashConfig.databaseTasks()` and then REGISTERS
only that subset — `Base.configurations(new DatabaseConfigurations(configs))`
(dist `:178`). `DatabaseConfigurations#isPrimary`
(`packages/activerecord/src/database-configurations.ts`, dist `:61-66`) asks
`findDbConfig(defaultEnv)` for the first config, and in the narrowed set that is
`hub`.

Rails never narrows the registered configurations.
`ActiveRecord::Base.configurations` stays whole; `configs_for` hides
`database_tasks: false` entries from ITERATION (`database_configurations.rb`
`configs_for(include_hidden: false)`), while `primary?` uses `find_db_config`,
which walks every configuration, hidden included. So in Rails `hub` is never
primary there and dumps to `db/hub_schema.rb`.

## Expected shape

The db command registers every configuration of the environment and iterates
`configsFor({ envName })` (which already filters hidden ones) for the work.

## Acceptance criteria

- [ ] With the first database `databaseTasks: false`, `trails db migrate` dumps the second database to `db/<name>_schema.ts` and leaves `db/schema.ts` alone.
- [ ] `isPrimary()` on the second database is false in that run.
- [ ] A fresh second database is not loaded from `db/schema.ts`.
- [ ] Test in trailties covering a hidden primary plus one task-enabled database.
