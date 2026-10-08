---
title: "SQLite3 configure_connection and reconnect call busy_handler_timeout=, busy_handler, rollback and the pragma setters"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: migration
packages: ["activerecord", "sqlite3"]
deps: ["sqlite3-adapter-new-client-is-database-new"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`): `reconnect` is `@raw_connection.rollback rescue nil` (`:814`);
`configure_connection` (`:820-848`) is `@raw_connection.busy_handler_timeout = timeout` (`:826`),
`raw_connection.busy_handler { |count| count <= retries }` (`:832`), and for each pragma
`if ::SQLite3::Pragmas.method_defined?("#{pragma}=")` then
`@raw_connection.public_send("#{pragma}=", value)` (`:839-840`).

trails has none of the first three on the seam (`grep -n "busyHandler\|rollback()" packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
is empty): `timeout` is passed at open through `SqliteOpenConfig.timeout`. The pragma loop exists
over `Pragmas` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:19`).

Related, check status: `sqlite-configure-connection-pragmas-precede-check-version` (open),
`sqlite-pragmas-option-validation-diverges-from-rails` (done).

## Acceptance criteria

- [ ] `reconnect` and `configureConnection` are `sqlite3_adapter.rb:810-848` branch for branch, including the `timeout` / `retries` arms and their deprecation path if Rails 8.0.2 has one there.
- [ ] `timeout` is no longer an open-time option; `Database#busyHandlerTimeout=` sets it after open as Rails does.
- [ ] The pragma loop uses `rbModMethodDefined`-shaped lookup on `SQLite3.Pragmas` and `rbFPublicSend` on the connection, as `:839-840`.
- [ ] `retries` follows `sqlite3-busy-handler-has-no-client-counterpart`.
- [ ] `pnpm parity:api:calls` and `:args` green for both methods.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/sqlite3-adapter.test.ts && pnpm parity:api:calls
```
