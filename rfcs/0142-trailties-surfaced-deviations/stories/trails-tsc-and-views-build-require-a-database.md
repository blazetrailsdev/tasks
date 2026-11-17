---
title: "trails-tsc and the views build connect to the database, so building needs a database file"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "trails-tsc", "activerecord"]
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

At trails 1d8d3725a3, `trails-tsc` (`pnpm build`) and `trails-tsc-views build` boot the application's initializers, and an initializer's connection checkout reaches the sqlite3 adapter. `packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts` raises `ArgumentError: No database file specified. Missing argument: database` with no file configured, as Rails' does. So typechecking and compiling views need a database. trailmap#151 passes a scratch `TASKS_DATABASE` in four places: the CI typecheck job, the Dockerfile, `scripts/smoke-boot.sh` and `scripts/dashboard-e2e.sh`.

Rails: compiling code and `assets:precompile` need no database. Connections are established lazily, on first use, so a build step that never queries never connects (`SECRET_KEY_BASE_DUMMY=1 rails assets:precompile` with no `DATABASE_URL` works).

## Expected shape

Booting for `trails-tsc` / `trails-tsc-views` does not check out a connection: nothing in the type-or-view build path issues a query, and the pool connects lazily as in Rails.

## Acceptance criteria

- `trails-tsc` and `trails-tsc-views build` succeed in an app whose database config has no file and no URL.

- trailmap drops the four scratch `TASKS_DATABASE`s.
