---
title: "trailmap: dev db:migrate dies with 'No database file specified' when TASKS_DATABASE is unset"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In a fresh trailmap worktree, with `HUB_DATABASE_URL` set and
`TASKS_DATABASE` unset, `NODE_ENV=development bin/trails db:migrate` fails with
`ArgumentError: No database file specified. Missing argument: database`.
With `TASKS_DATABASE` set it succeeds. Seen 2026-11-18 while booting for the
trailmap#175 screenshots.

The `tasks` entry (`config/database.ts`, `tasksEntry`) sets
`database: tasksDatabasePath()`, which is `undefined` when the variable is
unset, and also sets `databaseTasks: false`. Rails' `database_tasks: false`
keeps a config out of `db:migrate`, because `DatabaseTasks.migrate` iterates
`configs_for(env_name:)` without `include_hidden`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb`).
So either trailmap opens the tasks connection during boot, or trails'
`db:migrate` does not honour `databaseTasks: false`. If it is the second,
refile this as an activerecord framework story.

## Acceptance criteria

- [ ] Find which side opens the tasks connection under `db:migrate`.
- [ ] `bin/trails db:migrate` in development, with no `TASKS_DATABASE`, either
      migrates the primary database or refuses with a message that names
      `TASKS_DATABASE`.
