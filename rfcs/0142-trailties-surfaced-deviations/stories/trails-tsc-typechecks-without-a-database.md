---
title: "trails-tsc-typechecks-without-a-database"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc` boots the application's initializers before it typechecks, so in
trailmap a plain `pnpm build` (no `TRAILS_ENV`, no `TASKS_DATABASE`) stops with
`trails-tsc: No database file specified. Missing argument: database` from the
sqlite3 adapter, in development's `primary`. A typecheck reads no row; it should
not need a configured database. trailmap works around it by setting
`TRAILS_ENV=${TRAILS_ENV:-test}` in its `build` script (story
pnpm-build-typechecks-without-a-database-env).

## Acceptance criteria

- `trails-tsc` typechecks an app whose development database config cannot
  connect, with a test in trails.
- trailmap's `build` script drops its `TRAILS_ENV` default after the re-vendor.
