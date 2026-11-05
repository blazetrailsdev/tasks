---
title: "Move the db:* commander subcommands onto ActiveRecord's databases.rake tasks, part 2"
status: done
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: ["trailties", "activerecord"]
deps: ["port-rails-command-rake-command", "move-db-commands-onto-databases-rake-tasks-part-1"]
deps-rfc: []
est-loc: 600
priority: 2
pr: trails#9744
claim: "2026-11-05T16:06:39Z"
assignee: "move-db-commands-onto-databases-rake-tasks-part-2"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `db:*` as Rake tasks in
`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake` (626 lines), over
`ActiveRecord::Tasks::DatabaseTasks`. trails defines them as commander subcommands in
`packages/trailties/src/commands/db.ts` (992 lines) over the same `DatabaseTasks` port. Commander cannot be retired while
they live there. This part moves: `db:environment:set` (`db.ts:615`), `db:environment:check` (`db.ts:632`), `db:abort_if_pending_migrations` (`db.ts:649`), `db:seed` (`db.ts:710`), `db:seed:replant` (`db.ts:720`), `db:truncate_all` (`db.ts:734`), `db:prepare` (`db.ts:746`), `db:test:load_schema` (`db.ts:789`), `db:test:prepare` (`db.ts:796`), `db:reset` (`db.ts:855`), `db:setup` (`db.ts:868`), `db:schema:dump` (`db.ts:880`), `db:schema:load` (`db.ts:897`), `db:schema:cache:dump` (`db.ts:945`), `db:schema:cache:clear` (`db.ts:969`) (15 tasks).

## Acceptance criteria

- [ ] Each task is defined through the Rake DSL with `databases.rake`'s name, `desc`,
      prerequisites (`load_config`, `:environment`) and body, calling `DatabaseTasks` as the `.rake`
      body does. The multi-db `db:migrate:<name>` / `db:create:<name>` task generation follows the
      `.rake` loops.
- [ ] The corresponding `db.ts` commander code is deleted, and `bin/trails db:<task>` reaches
      the task through `RakeCommand`.
- [ ] The existing `db` command tests keep passing through the new path.
- [ ] For each `commands/db.ts` deviation story rehomed from RFC 0142 whose code this part deletes (`db-database-flag-loads-primary-schema`, `db-command-registers-only-task-enabled-configs-so-a-hidden-primary-promotes-the-next`, `db-prepare-sets-and-restores-the-schema-format-seat-around-prepare-all`, `db-seed-goes-through-database-tasks-load-seed`, `trailties-migrate-status-messages-cost-a-second-pool`): either the ported `.rake` body converges it and the PR closes that story, or the story is updated to point at the Rake task.
