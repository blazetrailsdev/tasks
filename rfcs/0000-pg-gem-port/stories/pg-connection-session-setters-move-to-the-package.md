---
title: "pg: set_client_encoding, set_notice_receiver, server_version and conndefaults_hash"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps: ["pg-connection-exec-surface-moves-to-the-package", "pg-errors-carry-result-and-connection"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `configure_connection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:955-1000`) calls
`@raw_connection.set_client_encoding(@config[:encoding])` (`:960`) and
`@raw_connection.set_notice_receiver do |result| ... end` (`:966-974`), reading
`result.error_field(PG::Result::PG_DIAG_MESSAGE_PRIMARY)`, `PG_DIAG_SQLSTATE`, `PG_DIAG_SEVERITY`.
`get_database_version` is `with_raw_connection { |conn| conn.server_version }` (`:634-644`).
`new_client`'s caller slices config with `PG::Connection.conndefaults_hash.keys + [:requiressl]`
(`:330`).

Gem: `set_notice_receiver` `vendor/pg/v1.5.9/ext/pg_connection.c:4601`, `set_client_encoding` `:4607`,
`server_version` `:4522` (libpq reads the startup `server_version` parameter; no query);
`conndefaults_hash` Ruby `vendor/pg/v1.5.9/lib/pg/connection.rb:337` over C `conndefaults` `:4491`.

trails: `_serverVersion` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1789`) runs a query;
`_sliceValidConnParams` (`:1509-1518`) holds an allowlist, guarded by the done story
`guard-pg-conn-param-allowlist-against-driver-drift`.

## Acceptance criteria

- [ ] `PG.Connection#setClientEncoding(encoding)` (`Promise`), `#setNoticeReceiver(proc)` (sync; returns the previous receiver as the gem does; the proc receives a `PG.Result` answering `errorField`), `#serverVersion()` (sync integer, from the `server_version` ParameterStatus the engine captures at connect; 0 if never received, as libpq).
- [ ] `configureConnection` and `getDatabaseVersion` call them as Rails does; `_serverVersion` and its query are deleted. If `serverVersion` cannot be answered from ParameterStatus on node-pg, the story stops and records why instead of keeping a query behind a sync name.
- [ ] `PG.Connection.conndefaultsHash()` exists and `validConnParamKeys` is `conndefaults_hash.keys + ["requiressl"]`. HOW it is answered is RFC open question 5; implement the answer, and keep the drift guard's test meaningful against it.
- [ ] `pnpm parity:api:calls` green for `configure_connection`, `get_database_version` and `new_client`'s caller; converged rows deleted by hand.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:calls
```
