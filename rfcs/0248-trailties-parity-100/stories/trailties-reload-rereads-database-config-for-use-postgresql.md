---
title: "trailties: a reloaded model re-reads config/database.ts, so use_postgresql can follow boot"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-24T17:07:12Z"
assignee: "query-logs-pet-connection-in-request"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/rake/multi_dbs_test.rb:1021-1041` ("db:prepare runs seeds once")
boots first (`require "#{app_path}/config/environment"`, `:1022`) and only then calls
`use_postgresql(multi_db: true)` (`:1024`). The `Dog.count` at `:1036` then reaches Postgres: `generate_models_for_animals`
ends with `reload` (`:409-414`), and the reloaded `AnimalsBase` resolves `establish_connection :animals` against
the rewritten `config/database.yml`.

The port (`packages/trailties/test/application/rake/multi-dbs.test.ts`, trails#10522) calls
`t.usePostgresql({ multiDb: true })` BEFORE `t.bootTrails()`. Called after boot, the in-process `Dog` still connects
through the SQLite configuration loaded at boot, and fails with `SQLite3::SQLException: no such table: dogs`. So
`Generation#reload` (`packages/trailties/test/support/isolation/abstract-unit.ts:559`, `Dependencies.clear()`), or the
reload of `AnimalsBase` after it, does not re-read `config/database.ts` the way Rails' reloaded model does.

## Acceptance criteria

- [ ] After `reload`, a model whose class body calls `establishConnection(":animals")` resolves it against the current `config/database.ts`.
- [ ] "db:prepare runs seeds once" calls `t.bootTrails()` before `t.usePostgresql({ multiDb: true })`, in Rails' order, and passes in the Trailties PostgreSQL lane.
