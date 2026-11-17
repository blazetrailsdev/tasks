---
title: "TestDatabases.createAndLoadSchema rebuilds every test database, with no way to give a worker its own copy of just one"
status: draft
updated: 2026-11-17
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
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

Found by trailmap#155. `TestDatabases.createAndLoadSchema(i, { envName })`
(`activerecord/lib/test-databases.ts:8-21`) reconstructs EVERY configuration
of the environment and then calls `Base.establishConnection()` with no
argument. trailmap needs a per-worker copy of the SQLite `primary` only: with
`HUB_DATABASE_URL` set, the call also drops and recreates
`trailmap_hub_test-<n>` in Postgres for every vitest file, databases nothing
uses (the hub tests connect to their own URL). The only levers are the
config's `databaseTasks`, which also changes `trails db`, or re-implementing
the loop over `DatabaseTasks.reconstructFromSchema` in the app.

Rails' `create_and_load_schema` is the same shape
(activerecord/lib/active_record/test_databases.rb), but Rails runs it once per
forked worker, not once per file, so the cost never shows. Check whether Rails
offers a per-config filter (e.g. `include_hidden`, `database_tasks`) before
inventing one.

## Acceptance criteria

- An application can give each parallel worker its own copy of a subset of
  the test databases, in the Rails spelling if Rails has one, without
  re-implementing `createAndLoadSchema` and without changing what `trails db`
  migrates.
- A test covers it with two databases, only one rebuilt.
