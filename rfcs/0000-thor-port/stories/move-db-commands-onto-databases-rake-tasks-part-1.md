---
title: "Move the db:* commander subcommands onto ActiveRecord's databases.rake tasks, part 1"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties", "activerecord"]
deps: ["port-rails-command-rake-command"]
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
they live there. This part moves: `db:migrate` (`db.ts:539`), `db:rollback` (`db.ts:564`), `db:forward` (`db.ts:583`), `db:version` (`db.ts:602`), `db:migrate:up` (`db.ts:672`), `db:migrate:down` (`db.ts:691`), `db:create` (`db.ts:803`), `db:drop` (`db.ts:809`), `db:migrate:status` (`db.ts:815`), `db:migrate:redo` (`db.ts:825`) (10 tasks).

## Acceptance criteria

- [ ] Each task is defined through the Rake DSL with `databases.rake`'s name, `desc`,
      prerequisites (`load_config`, `:environment`) and body, calling `DatabaseTasks` as the `.rake`
      body does. The multi-db `db:migrate:<name>` / `db:create:<name>` task generation follows the
      `.rake` loops.
- [ ] The corresponding `db.ts` commander code is deleted, and `bin/trails db:<task>` reaches
      the task through `RakeCommand`.
- [ ] The existing `db` command tests keep passing through the new path.
