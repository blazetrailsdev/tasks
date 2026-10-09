---
title: "trails db create hangs on a Postgres database that already exists"
status: draft
updated: 2026-10-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48), whose `hub` database is PostgreSQL.

`trails db create` never returns when the Postgres database it is asked to
create already exists. No output, no error, no exit — the process sits there
until it is killed.

Reproduce, against a reachable Postgres whose `trailmap_hub_test` exists:

```sh
HUB_DATABASE_URL=postgres://postgres:…@host:5432/trailmap_hub_test \
  pnpm exec tsx node_modules/@blazetrails/trailties/bin/trails.js db create
# … no output, still running after five minutes
```

The sibling failure, on a database that does NOT exist, is loud but wrong:

```text
We could not find your database: trailmap_hub_smoke2.
Couldn't create 'trailmap_hub_smoke2' database. Please check your configuration.
NoDatabaseError: We could not find your database: trailmap_hub_smoke2
  sql: `CREATE DATABASE "trailmap_hub_smoke2" ENCODING = 'utf8'`
```

Both point the same way: the create path connects to the TARGET database to
issue `CREATE DATABASE`. Rails connects to the maintenance database
(`postgres`) for that, which is why `rails db:create` can create a database
that does not exist yet and reports "already exists" for one that does.

Why it matters beyond ergonomics: a boot smoke test or a CI job that runs
`db create` before `db migrate` — the shape `trails new` generates, and the
shape `scripts/smoke-boot.sh` uses — HANGS instead of failing, so the job burns
its whole timeout and reports nothing useful. trailmap's `boot` job is in
exactly that state and is why this story is blocking there; it carries no
workaround for it.

## Converged shape

Rails' `PostgreSQLDatabaseTasks#create` connects to the maintenance database
and creates from there, and treats an existing database as a reported no-op
rather than an error:

- connect with the same config but `database: "postgres"` (Rails'
  `establish_master_connection`),
- `CREATE DATABASE` from that connection,
- map `DatabaseAlreadyExists` to the "already exists" message and a zero exit,
  as `db:create` does for SQLite today.

## Acceptance criteria

- [ ] `db create` against an existing Postgres database prints that it already
      exists and EXITS zero, in bounded time.
- [ ] `db create` against a non-existent Postgres database creates it.
- [ ] Both are covered by a trailties test that would hang or fail on the
      current code (a timeout assertion, so a regression cannot pass by
      hanging).
- [ ] `db drop` is checked for the same maintenance-connection assumption.
