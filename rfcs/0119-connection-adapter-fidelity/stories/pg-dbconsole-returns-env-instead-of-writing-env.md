---
title: "PostgreSQLAdapter.dbconsole returns an env object instead of writing ENV"
status: draft
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

Rails' `PostgreSQLAdapter.dbconsole`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:73-90`)
writes `PGUSER`, `PGHOST`, `PGPORT`, `PGPASSWORD`, `PGSSLMODE`, `PGSSLCERT`, `PGSSLKEY`,
`PGSSLROOTCERT` and `PGOPTIONS` into `ENV`. It returns whatever `find_cmd_and_exec` returns.
Trails (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, `static dbconsole`)
builds a local `env` object and returns `{ env, argv }`, which is a return shape Rails does not have.
It also skips `PGOPTIONS` when the filtered list is empty. Rails assigns it anyway, even when the
result is `""` (`:85-87`).

The ported `adapters/postgresql/dbconsole.test.ts` (trails#7683) therefore asserts on the returned
`env`, where Rails asserts on `ENV` inside `preserve_pg_env` (`dbconsole_test.rb:13-17`).

## Acceptance criteria

- [ ] `dbconsole` writes the variables through the ruby-compat `ENV` analogue and returns
      `findCmdAndExec(...)`, as `:89` does.
- [ ] `PGOPTIONS` is assigned whenever `variables` is set, even when the joined result is empty.
- [ ] `dbconsole.test.ts` reads `ENV` and restores it the way `preserve_pg_env` does.
