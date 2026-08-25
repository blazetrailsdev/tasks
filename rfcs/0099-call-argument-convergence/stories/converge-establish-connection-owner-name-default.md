---
title: "establish_connection's ownerName defaults to Base so database_tasks drops the kwarg"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6375
claim: "2026-08-11T20:06:07Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Left as a reviewed baseline row by PR #6370 (`call-args-ar-kwarg-key-set`).

Rails' `DatabaseTasks.with_temporary_pool` (`activerecord/lib/active_record/tasks/database_tasks.rb:544,548`) passes no owner:

```ruby
pool = migration_class.connection_handler.establish_connection(db_config, clobber: clobber)
...
migration_class.connection_handler.establish_connection(original_db_config, clobber: clobber)
```

It relies on `establish_connection`'s `owner_name: Base` default
(`activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:115`).

trails' handler cannot import `Base` — the comment at
`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:70-76`
records the module cycle — so `establishConnection` falls back to a
config-name `ConnectionDescriptor` instead, and `database-tasks.ts` has to name
the owner explicitly (`ownerName: migrationClass.connectionClassForSelf()`) to
land in the right pool.

Two `kind: "args"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`
carry this, keyed `with_temporary_pool` / `establish_connection`.

## Converged shape

`establishConnection`'s `ownerName` defaults to `Base`, as
`connection_handler.rb:115` does, and both `database-tasks.ts` call sites drop
the kwarg so they read exactly as `database_tasks.rb:544,548`. The zero-import
slot module is the settled trails answer for a call-time constant that would
otherwise close a module cycle (CLAUDE.md, "Call-time constant resolution") —
`Base` reaches the handler through a slot rather than an eager import.

## Acceptance criteria

1. `with_temporary_pool`'s two `establish_connection` calls pass what
   `database_tasks.rb:544,548` pass — `clobber:` only.
2. The default owner resolves to `Base`, matching `connection_handler.rb:115`.
3. Both baseline rows are deleted by hand (only-shrink, never `--write`).
4. `pnpm parity:api:calls:args` green; the multi-database and tasks suites stay
   green (a wrong default owner silently reroutes pools).
