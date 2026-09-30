---
title: "activerecord: raise Rails' error classes in the 20 connection-adapters files grandfathered by rails-error-parity"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: errors
packages: ["activerecord"]
deps: ["retire-dead-error-parity-disables-and-stale-arm-throw-marks"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-error-parity` requires Rails-mirroring source to raise the ported error class Rails
raises (same class, same message, same site — CLAUDE.md § "Errors"). Pre-existing violators are
grandfathered in `eslint/rails-error-parity-exclude.json`, which is only-shrink; it holds **74**
activerecord files. This story takes the connection-adapters group:

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts`
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
- `packages/activerecord/src/connection-adapters/abstract/assert-schema-adapter.ts`
- `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
- `packages/activerecord/src/connection-adapters/abstract/quoting.ts`
- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
- `packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts`
- `packages/activerecord/src/connection-adapters/abstract/transaction.ts`
- `packages/activerecord/src/connection-adapters/mysql/quoting.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-creation.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
- `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`
- `packages/activerecord/src/sqlite/expo-sqlite.ts`
- `packages/activerecord/src/sqlite/node-sqlite.ts`

`retire-dead-error-parity-disables-and-stale-arm-throw-marks` (RFC 0127) retires three dead inline disables first.

## Acceptance criteria

- [ ] Every bare `Error` / wrong-class throw in these files raises Rails' class with Rails' message, and each file is removed from `rails-error-parity-exclude.json`.
- [ ] Files under `test-helpers/` / `support/` that mirror Rails `test/` code raise what the Rails test helper raises.
- [ ] `pnpm lint` green with the files removed.
