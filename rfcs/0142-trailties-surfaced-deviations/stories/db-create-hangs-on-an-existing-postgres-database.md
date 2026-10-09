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

`trails db create` never returns when its Postgres database already exists. It
does all of its work and prints all of its output first:

```sh
$ HUB_DATABASE_URL=postgres://…/trailmap_hub_test trails db create
Database 'storage/development.sqlite3' already exists
Database 'trailmap_hub_test' already exists
# … still running. killed at 25s, exit 124
```

Both lines are correct. `DatabaseTasks.create` did its job and reported it,
and `PostgreSQLDatabaseTasks#create` already connects through the maintenance
database (`publicSchemaConfig()`) exactly as Rails does. **The command is
simply unable to end.**

The cause is an open connection pool, not a bad query. `db.ts` registers
`establishTaskConnection` on `preSubcommand` and has no matching teardown, and
`PostgreSQLDatabaseTasks#create` finishes by establishing a pool on the
database it just handled. On SQLite that costs nothing — better-sqlite3 is
synchronous and holds no libuv handle, so the process exits anyway. On
PostgreSQL the pool's sockets keep Node's event loop alive forever.

Confirmed directly: the same script that hangs exits 0 the moment
`connectionHandler.clearAllConnectionsBang()` is called before it ends.

Why it matters beyond ergonomics: a boot smoke test or a CI job that runs
`db create` before `db migrate` — the shape `trails new` generates, and the
shape trailmap's `scripts/smoke-boot.sh` uses — HANGS instead of failing, so
the job burns its whole timeout and reports nothing. trailmap's `boot` job sat
for 24 minutes before it was cancelled, with every other job on the PR green.

Note for whoever reads the original filing: it guessed the cause was the
maintenance connection, by analogy with Rails'
`establish_master_connection`. That guess was wrong — the reproduction above
is what the fix was written against.

## Converged shape

A `postAction` hook on the `db` command, pairing the `preSubcommand` one that
opens the connection:

```ts
cmd.hook("preSubcommand", establishTaskConnection);
cmd.hook("postAction", releaseTaskConnections);
```

`postAction` fires after a subcommand's action, including the chained ones
(`db prepare`, `db reset`), and `clearAllConnectionsBang` disconnects the pools
while leaving their configurations registered, so anything that queries
afterwards reconnects.

This is a Node necessity rather than a Rails divergence: `rake db:create` ends
when the Ruby process ends and nothing hands the connection back. The teardown
carries `@noRailsEquivalent PERMANENT`.

## Acceptance criteria

- [x] `db create` against an existing Postgres database prints that it already
      exists and EXITS zero, in bounded time.
- [x] A trailties test asserts no pool is left connected after the command, over
      SQLite — nothing in the assertion is adapter-specific, so it pins the
      behaviour without a Postgres server in the lane — and it fails on `main`.
- [x] The chained commands (`db prepare`, `db reset`) are covered by the same
      hook, and the existing 109 `db.test.ts` cases still pass.
- [ ] `db drop`, `db schema:load` and the other verbs are confirmed to leave
      nothing open either, once this lands.
