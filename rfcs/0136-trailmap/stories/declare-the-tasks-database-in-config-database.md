---
title: "Declare the live tasks database in config/database.ts and retire the connecting initializer"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord", "trailties"]
deps:
  [
    "trailties-lacks-active-record-initialize-database-initializer",
    "enum-raises-undeclared-type-on-an-unreflected-cold-model",
  ]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the trailmap Rails-idiom audit. The live tasks database is wired up
outside the Rails configuration path:

- `config/database.ts:3-16` declares `development` / `test` / `production`
  pointing at `storage/<env>.sqlite3`, none of which the served app uses. It
  then exports `tasksDatabaseConfig()` / `hasTasksDatabase()` (`:47-61`) over
  `env.TASKS_DATABASE`.
- `config/initializers/tasks-database.ts:38-51` calls
  `Base.establishConnection(tasksDatabaseConfig())` itself, raises when
  `TASKS_DATABASE` is unset outside `test`, and warms every model with
  `loadModelSchemas()` (`app/models/index.ts:37-39`).
- The comment at `config/database.ts:18-24` gives the reason for keeping the DB
  out of the env keys: `trails db migrate` fans out over them and must never
  migrate the CLI's live file.

The Rails-shaped version:

- The environment's database config names the file,
  `database: <%= ENV["TASKS_DATABASE"] %>`. Rails' answer to "db tasks must
  not touch this database" is `database_tasks: false` on that config
  (`activerecord/lib/active_record/database_configurations/hash_config.rb:161-162`,
  `database_tasks?`). trails ports it as `databaseTasks`
  (`packages/activerecord/src/database-configurations/hash-config.ts:131-134`).
- The framework connects at boot:
  `initializer "active_record.initialize_database"`
  (`activerecord/lib/active_record/railtie.rb:256-262`) runs
  `establish_connection` for every process. trails lacks that initializer. It
  is already filed as `trailties-lacks-active-record-initialize-database-initializer`
  (in the retired RFC 0023). That is the real reason the initializer exists:
  the deployed 500 (`deployed-rfcs-index-500s-with-connectionnotdefined`).
- `loadModelSchemas` works around
  `enum-raises-undeclared-type-on-an-unreflected-cold-model` (RFC 0023).

This story does the part that is available today and deletes the rest as its
framework dependencies land.

## Acceptance criteria

- `config/database.ts` points the served environments at `env.TASKS_DATABASE`
  with `pool: 1` and `databaseTasks: false`. `trails db migrate` in those envs
  is proven not to touch the file.
- `tasksDatabaseConfig` / `hasTasksDatabase` are gone, and `scripts/*` read the
  config through `configFor("database")` / the resolved `DatabaseConfig`.
- Once `trailties-lacks-active-record-initialize-database-initializer` lands and
  is re-vendored, `config/initializers/tasks-database.ts` is deleted. Its
  "unset `TASKS_DATABASE` refuses to boot" guarantee moves to the config (an
  unset env var fails the connection at boot), and `scripts/smoke-boot.sh`
  still proves both directions.
- Once the enum cold-model story lands, `loadModelSchemas` and its callers are
  deleted, and `test/models/schema-loading.test.ts` still passes without the
  warm-up.
