---
title: "commands/db.ts reads resolveEnv() where Rails reads DatabaseTasks.env / Rails.env"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8131 made `loadDatabaseConfig` / `loadAllDatabaseConfigs`
(`packages/trailties/src/database.ts`) default their env to
`TopLevel.Trails?.env ?? resolveEnv()`, mirroring `ActiveRecord::ConnectionHandling::RAILS_ENV`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:6-7`):
`(Rails.env if defined?(Rails.env)) || ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence`.

`packages/trailties/src/commands/db.ts` still reads the process env directly through
`resolveEnv()` at `:105` (a parameter default), `:224` (the `toDbConfig` default), and
`:488, :527, :621, :638, :752, :951, :976`. So a `Trails.env = "staging"` assignment
made in process is invisible to the db commands. The Rails database tasks read
`ActiveRecord::Tasks::DatabaseTasks.env`, which defaults to
`ActiveRecord::ConnectionHandling::DEFAULT_ENV.call`
(`activerecord/lib/active_record/tasks/database_tasks.rb`, `def env`).

## Converged shape

Each site reads the env the way its Rails counterpart does: `DatabaseTasks.env`, or
`Trails.env` where Rails reads `Rails.env`. Nothing calls `resolveEnv()` outside `Trails.env`'s
own initialization.

## Acceptance criteria

- `grep -n "resolveEnv()" packages/trailties/src/commands/db.ts` finds nothing.
- A db command test sets `Trails.env = "staging"` with no `TRAILS_ENV`, and the staging
  config is used.
