---
title: "smoke-boot builds its scratch tasks database from the test environment"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#88
claim: "2026-10-28T12:04:01Z"
assignee: "port-pr-82-to-the-rails-twin"
blocked-by: null
closed-reason: null
---

## Context

Prerequisite found while attempting `declare-the-tasks-database-in-config-database`.

`scripts/smoke-boot.sh:47-50` builds its empty tasks database by running
`trails db create` + `db migrate` in the DEVELOPMENT environment and pointing
`TASKS_DATABASE` at `storage/development.sqlite3`. Once the served environments
name `env.TASKS_DATABASE` with `databaseTasks: false`, that recipe produces
nothing: `db migrate` skips the hidden database by design.

Verified on trailmap@ae5cd69: `NODE_ENV=test trails db create && NODE_ENV=test
trails db migrate` builds `storage/test.sqlite3` from `db/schema.ts` and works
as the scratch database. Also, a boot with no `TASKS_DATABASE` under the
framework's `active_record.initialize_database` fails with
`ArgumentError: No database file specified. Missing argument: database`, not
the "TASKS_DATABASE is not set" that `scripts/smoke-boot.sh:161` greps for.

This can land before the config change: the test-environment recipe works today.

## Acceptance criteria

- [ ] `scripts/smoke-boot.sh` builds its scratch tasks database from the test environment (or another path that does not depend on the served environments running database tasks).
- [ ] The no-database refusal check matches whichever message the boot path then raises, and still fails when the boot succeeds.
- [ ] CI's boot job stays green.
