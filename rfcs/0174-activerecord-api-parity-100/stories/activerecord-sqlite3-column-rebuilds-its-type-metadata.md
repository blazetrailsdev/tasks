---
title: "activerecord: SQLite3::Column#initialize rebuilds the SqlTypeMetadata it is handed"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8765
claim: "2026-10-10T19:39:39Z"
assignee: "activerecord-prepended-super-first-parameters-onto-super-method"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Column#initialize` is `def initialize(*, auto_increment: nil, rowid: false, generated_type: nil, **)`
with a bare `super` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/column.rb:9-14`):
the `sql_type_metadata` it is handed goes to `Column#initialize` untouched
(`connection_adapters/column.rb:20-28`).

trails' `packages/activerecord/src/connection-adapters/sqlite3/column.ts:11-44` instead types the
third parameter as a structural `{ sqlType, type, precision, limit, scale }` and rebuilds it with
`new SqlTypeMetadata({...})` before calling `super`. That is a construction Rails does not make: it
discards the instance `fetch_type_metadata` returned (deduplicated since trails#8368) and stores an
unregistered copy, which `Column#deduplicated` then has to deduplicate again. The MySQL and
PostgreSQL column classes had the same rebuild removed by
`accept-adapter-type-metadata-in-column-subclass-constructors`; this is the SQLite residue.

## Acceptance criteria

- [ ] `SQLite3::Column`'s constructor takes the `SqlTypeMetadata | null` its parent takes and passes it to `super` unchanged; no `new SqlTypeMetadata` remains in `sqlite3/column.ts`.
- [ ] Call sites and tests that pass a bare object literal build a `SqlTypeMetadata` themselves.
- [ ] The SQLite column and schema suites stay green.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
