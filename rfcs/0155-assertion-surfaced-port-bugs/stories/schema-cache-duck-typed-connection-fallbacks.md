---
title: "SchemaCache duck-types the pool and connection where Rails calls with_connection unconditionally"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#8087's `SchemaCache` nil-spelling change.

Rails' `SchemaCache` always calls `pool.with_connection { |connection| connection.X(...) }` unconditionally: `primary_keys` (`schema_cache.rb:298-304`), `data_source_exists?` (`:320-322`), `columns` (`:344-348`), `columns_hash` (`:352-360`), `indexes` (`:363-372`), `version` (`:375-380`) and `tables_to_cache` (`:428-433`).

`packages/activerecord/src/connection-adapters/schema-cache.ts` instead uses:

- a module-level `withConnection(pool, cb)` helper that calls `cb(pool)` when `pool` has no `withConnection`, treating a bare connection or `null` as a pool;
- `typeof connection.X === "function"` guards in each of those methods, which fall back to `null` / `undefined` / `[]` where Rails would raise `NoMethodError`.

These are invented arms that let test doubles (`FakePool`, a `null` pool) stand in for a real pool, and they are why `columns` / `columnsHash` still carry `| undefined`.

## Acceptance criteria

- Each method calls `pool.withConnection` and the connection method unconditionally, as the cited Rails bodies do. The `withConnection` shim and the `typeof` fallbacks are deleted.
- Tests that relied on the fallbacks use a real pool (or `FakePool` answering the full contract) instead.
- `columns` / `columnsHash` return types drop `undefined`.
- `schema-cache.test.ts`, `schema-cache.trails.test.ts` and `model-schema*.trails.test.ts` stay green.
