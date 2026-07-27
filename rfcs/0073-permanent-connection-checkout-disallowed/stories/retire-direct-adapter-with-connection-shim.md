---
title: "Retire withPooledOrDirectConnection by eliminating Model.adapter = x"
status: ready
updated: 2026-07-27
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5323 added `withPooledOrDirectConnection` + `leasablePool`
(`packages/activerecord/src/connection-handling.ts`) so internal
`with_connection` call sites also serve models with no handler-registered pool:
those backed by a directly-assigned adapter (`Model.adapter = x`) and HABTM join
models whose `connectionPool()` throws.

Rails has no `Model.adapter = x` — every model resolves through a pool
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb`), so
`with_connection` needs no such fallback there. The helper is a trails-only
shim that exists purely because `Model.adapter =` is a trails invention; each
new `with_connection` port has to route through it instead of the Rails-named
`withConnection`.

Related: [[project_sidecar_test_pool_is_railsless_invention_eliminate]]-style
convergence — the endgame is that direct-adapter models go away (tests
establish a pool instead), at which point `withPooledOrDirectConnection`
collapses into `withConnection` and `leasablePool` keeps only the HABTM
join-model arm.

## Acceptance criteria

- Inventory the models/tests that rely on `Model.adapter = x` (grep
  `this.adapter =` / `static adapter =` under `packages/activerecord/src`).
- Either migrate them to an established pool, or record why each must stay.
- If the inventory empties, delete `withPooledOrDirectConnection` and route
  `cachedFindBy` / `InsertAll.execute` straight through `withConnection`.
