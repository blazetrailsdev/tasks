---
title: "Relation#exec_main_query borrows via with_connection; retire _conn()'s deprecated fallback"
status: ready
updated: 2026-09-11
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `relation-conn-fallback-reads-deprecated-connection` (trails#7699),
which converged `updateAll` / `deleteAll` / `computeCacheVersion` and
`_updateRecord` / `_deleteRecord` onto `withConnection`.

`packages/activerecord/src/relation.ts` `_conn()` still ends in
`?? this._model.connection` (the deprecated getter). Its remaining callers:

- `execMainQuery` — Rails `relation.rb:1436` wraps the body in
  `model.with_connection do |c|` and threads `c` into both `select_all` calls
  (`:1443`, `:1446`). trails' body is sync (it returns `Result | FutureResult`),
  so it reads `_conn()` instead. It is reached from `records()`' `withConnection`
  scope (`relation.ts:580`), where `activeConnection` answers, so the fallback
  is not hit today — but the shape is not Rails'.
- `toSql` — already tagged `@missingRailsCall with_connection — CONVERGEABLE
converge-sync-eager-builders-async-to-sql`.
- `_materializeLimitedIds` / `_distinctSelectForLimitedIds` — trails-only eager
  helpers with no Rails body; they should take the connection as a parameter
  from their caller's `with_connection` block rather than re-resolving it.

`exec_main_query` is a private, uncompared pair, so `parity:api:calls` reports
no row for it and a `@missingRailsCall` tag at the call site would be STALE.

## Acceptance criteria

- `execMainQuery` borrows via `withConnection` and threads `c`, mirroring
  `relation.rb:1436-1447` (making it async if needed).
- The limited-ids helpers receive the connection from their caller.
- `_conn()` loses its `this._model.connection` fallback, or is deleted.
- Re-measure with the RFC 0073 gate instrumentation armed `disallowed`: no hits
  from `relation.ts`.
