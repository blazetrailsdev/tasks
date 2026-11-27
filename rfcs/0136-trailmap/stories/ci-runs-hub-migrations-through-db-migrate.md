---
title: "CI runs pending hub migrations through bin/trails db:prepare over a non-empty hub"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#206
claim: "2026-11-27T03:14:41Z"
assignee: "ci-runs-hub-migrations-through-db-migrate"
blocked-by: null
closed-reason: null
---

trailmap#180: hub migration 20261119000008 failed every deploy's release task for hours, yet CI was green. Its unit test called `up()` directly with `Base` still on SQLite. Under the real runner, `DatabaseTasks.withTemporaryPool` (node_modules/@blazetrails/activerecord/dist/tasks/database-tasks.js:497; Rails database_tasks.rb `with_temporary_pool`) re-establishes `Base` on the hub, so any `Base` model in a hub migration queries Postgres. CI's `image`/`smoke-prod` jobs load the schema into an empty hub (db:prepare's fresh path), which runs no migrations at all.

## Acceptance criteria

- A CI job migrates a hub sitting at main's last hub migration version (not empty) to HEAD with `NODE_ENV=production bin/trails db:prepare`, inside the built image, against a copy-shaped tasks.db.
- Reverting #180's migration fix makes that job fail with "no refinements table".
