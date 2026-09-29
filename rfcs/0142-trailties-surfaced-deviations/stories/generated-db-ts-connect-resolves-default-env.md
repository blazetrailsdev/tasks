---
title: "generated-db-ts-connect-resolves-default-env"
status: done
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8236
claim: "2026-09-28T22:48:37Z"
assignee: "generated-db-ts-connect-resolves-default-env"
blocked-by: null
closed-reason: null
---

## Context

`ar new` writes a `db.ts` whose `connect()` runs `loadDatabaseConfig(import.meta.dirname)`
and then a bare `Base.establishConnection()`. `loadDatabaseConfig`
(`packages/activerecord-cli/src/db-helpers.ts:6-20`) already establishes the
`DatabaseTasks.env` connection. The bare call then resolves
`DEFAULT_ENV()` (`packages/activerecord/src/connection-handling.ts:487`), which is
`default_env` when neither `TRAILS_ENV` nor `NODE_ENV` is set. That is faithful to Rails
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:7`).
So `connect()` raises
`ActiveRecord::AdapterNotSpecified: The 'default_env' database is not configured for the 'default_env' environment.`

`ar`'s own commands work only because `run` seeds `TRAILS_ENV=development`
(`packages/activerecord-cli/src/cli.ts:225-227`). Code outside `ar` (a server,
a worker), which is `db.ts`'s whole purpose, does not get that seed.
Closing `rails-env-proc-drops-trails-env-arm-so-boot-without-trails-env-fails` (#8201) fixed the
trailties path only.

Found re-running the `activerecord-cli` README quickstart (PR #8195) on `main` at `c19bfc0aee`.

## Acceptance criteria

- [ ] With `TRAILS_ENV` and `NODE_ENV` unset, the generated `db.ts` `connect()`
      connects to `development`, matching the environment `ar` itself picks.
- [ ] The SQLite e2e suite (`src/__e2e__/sqlite-happy-path.test.ts`) exercises
      `connect()` with both env vars unset.
