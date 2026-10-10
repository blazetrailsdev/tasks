---
title: "trails db drop connects to the database it is dropping, so Postgres refuses it"
status: draft
updated: 2026-10-10
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

`trails db drop` connects to the database it is about to drop, so Postgres
refuses the statement:

```text
$ HUB_DATABASE_URL=postgres://…/trailmap_hub_test pnpm db:reset
DatabaseError: cannot drop the currently open database
    routine: 'dropdb'
```

This is the mirror of `db-create-hangs-on-an-existing-postgres-database`
(trails#8730): `create` leased a pool against the target database and never
disconnected it, and `drop` leases one against the target and then issues
`DROP DATABASE` down that very connection. Postgres allows neither — `dropdb`
rejects a drop issued from inside the database, and it also rejects one while
any other session holds it open.

Rails does this through a MAINTENANCE connection. `drop_database` in
`ActiveRecord::Tasks::PostgreSQLDatabaseTasks` establishes a connection to the
`postgres` database and runs `DROP DATABASE IF EXISTS` from there, which is why
`rails db:reset` works against Postgres without the caller doing anything
special.

Found by trailmap (trailmap#48), amending a hub migration and wanting the test
database rebuilt from the migrations rather than patched by hand. `db:reset`
is `drop && create && migrate && seed`, so the whole script is unusable on
Postgres today; the workaround was a one-off `DROP INDEX` / `CREATE UNIQUE
INDEX` script, which does not generalise and does not prove the migration.

## Converged shape

`drop` resolves its connection the way `create` now does: against the
maintenance database (`postgres`), never against the target, and releases it
when it is done.

- establish the pool on the maintenance database;
- `DROP DATABASE IF EXISTS "<target>"`;
- disconnect, so the command's process can exit and a following `create` in the
  same `db:reset` run is not blocked by a lingering session.

## Acceptance criteria

- [ ] A Postgres task test drops an existing database and the command succeeds;
      it fails on the current code with `cannot drop the currently open
database`.
- [ ] `db drop` on a database that does not exist is a no-op that exits zero,
      as `IF EXISTS` implies and as Rails behaves.
- [ ] `drop` leaves no pool behind: a `drop` followed by `create` and `migrate`
      in one process — the `db:reset` sequence — completes.
- [ ] SQLite's path is untouched, with a case covering it, since there is no
      maintenance connection there.
