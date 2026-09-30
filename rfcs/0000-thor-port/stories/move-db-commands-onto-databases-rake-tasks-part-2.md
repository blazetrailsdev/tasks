---
title: "Move the db:* commander subcommands onto ActiveRecord's databases.rake tasks, part 2"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties", "activerecord"]
deps: ["port-rails-command-rake-command", "move-db-commands-onto-databases-rake-tasks-part-1"]
deps-rfc: []
est-loc: 600
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `db:*` as Rake tasks in
`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake` (626 lines), over
`ActiveRecord::Tasks::DatabaseTasks`. trails defines them as commander subcommands in
`packages/trailties/src/commands/db.ts` (992 lines) over the same `DatabaseTasks` port. Commander cannot be retired while
they live there. This part moves: environment:set/check, abort_if_pending_migrations, seed(:replant), truncate_all, prepare, reset, setup, schema:dump/load, schema:cache:dump/clear, test:load_schema/prepare (`db.ts:600-990`).

## Acceptance criteria

- [ ] Each task is defined through the Rake DSL with `databases.rake`'s name, `desc`,
      prerequisites (`load_config`, `:environment`) and body, calling `DatabaseTasks` as the `.rake`
      body does. The multi-db `db:migrate:<name>` / `db:create:<name>` task generation follows the
      `.rake` loops.
- [ ] The corresponding `db.ts` commander code is deleted, and `bin/trails db:<task>` reaches
      the task through `RakeCommand`.
- [ ] The existing `db` command tests keep passing through the new path.
