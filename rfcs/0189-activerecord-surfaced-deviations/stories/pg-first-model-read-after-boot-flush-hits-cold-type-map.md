---
title: "PG: the first model read after the boot connection flush reaches lookupCastTypeFromColumn on an unconnected adapter"
status: ready
updated: 2026-11-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A production boot on PostgreSQL 500s on the first request that touches a model:
`TypeError: Cannot read properties of null (reading 'lookup')` from
`PostgreSQLAdapter#lookupCastTypeFromColumn`. Reproduced on AWS Lambda and locally
(unbundled, `TRAILS_ENV=production`, PG 18) in the serverless spike
(`examples/serverless-lambda`, branch `serverless-spike-12077e`).

Sequence:

1. `toPrepare` warms the schema cache (`packages/trailties/lib/trailties/active-record.ts:330-350`,
   `loadAllBang`), which connects and loads the type map.
2. `active_record.clear_active_connections` (`active-record.ts:362-369`, faithful to
   `vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:299-311`) flushes idle
   connections, so the pool is empty.
3. The first model read, `_defaultAttributes`, peeks the warm schema cache and reaches
   `typeForColumn` through `ConnectionPool#withConnectionSync`. That lease builds a new,
   never-connected adapter, so `_typeMap` is null.

`packages/activerecord/CLAUDE.md` § "Adapter facts are prewarmed and peeked" names exactly two
warm steps for `lookupCastTypeFromColumn` (`buildFixtureSql`, `loadSchemaFromAdapter`). The
warm-cache `_defaultAttributes` path is a third caller with none. In Ruby, `verify!` connects in line.

The spike works around it in the app's boot with
`await Base.connectionPool().withConnection((c) => c.verifyBang())` after boot.

## Acceptance criteria

- A booted production app on PostgreSQL serves its first model read after the boot flush
  with no app-side warm-up.
- The fix follows § "Adapter facts are prewarmed and peeked" (an awaited warm before the
  synchronous peek), and the section's list of warm steps is updated to name the new one.
- A regression test that boots (or simulates warm cache + flushed pool) and reads a model's
  attributes on PG, verified to fail on main.
