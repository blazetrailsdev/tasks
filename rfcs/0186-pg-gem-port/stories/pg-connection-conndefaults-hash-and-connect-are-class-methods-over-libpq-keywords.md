---
title: "PG::Connection.conndefaults_hash and PG.connect are class methods over libpq conninfo keywords; retire the connectionString config key"
status: draft
updated: 2026-10-10
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8745 made `PostgreSQLAdapter#initialize` Rails' body
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:314-333`):
`valid_conn_param_keys = PG::Connection.conndefaults_hash.keys + [:requiressl]`,
then `conn_params.slice!(*valid_conn_param_keys)`, and `new_client` is
`PG.connect(**conn_params)` (`postgresql_adapter.rb:55-70`).

The driver side it calls is still shaped by the `pg` npm client, in
`packages/activerecord/src/pg/connection.ts` and `pg/pg.ts`:

- `PG.Connection` is the object literal `{ conndefaultsHash }` in `pg/pg.ts`,
  not the `Connection` class `pg/connection.ts` now exports (since trails#8743).
  `conndefaultsHash` and `connect` are module functions. In the gem
  `conndefaults_hash` is a singleton method of `PG::Connection` and
  `PG.connect` is `PG::Connection.new`. A plain seat of the class in `pg.ts` was
  not possible in #8745 because `connection.ts` imports `PG` from `pg.ts`
  (TDZ when `connection.ts` is the entry module).
- `CONNINFO_KEYWORDS` in `pg/connection.ts` is a table of trails camelCase keys
  mapped to `pg`-npm config keys. It is not libpq's conninfo keyword list:
  it admits npm-only keys (`connectionString`, `stream`, `types`, `Promise`,
  `keepAlive`, `connectionTimeoutMillis`, ...) and lacks libpq keywords
  (`sslmode`, `connect_timeout`, `target_session_attrs`, ...). So
  `conn_params.slice!` keeps and drops a different key set from Rails.
- About 66 test sites construct `new PostgreSQLAdapter({ connectionString: url })`.
  Rails has no such key: a URL is resolved to a hash by
  `DatabaseConfigurations::UrlConfig` before the adapter sees it. Because the
  database name is then only inside `connectionString`, `new_client`'s
  `conn_params[:dbname]` / `[:user]` / `[:host]` rescue arms cannot fire for
  those configs, and they get `ConnectionNotEstablished` where Rails raises
  `NoDatabaseError` / `DatabaseConnectionError`.

## Acceptance criteria

- `conndefaultsHash` is a static of the `Connection` class and `PG.Connection`
  is that class; `PG.connect` builds a `Connection`. Resolve the
  `pg.ts` <-> `connection.ts` cycle with a namespace seat (root CLAUDE.md
  § "Call-time constant resolution"), verified by a plain-node import of the
  built `dist` modules in both directions.
- `conndefaults_hash` answers libpq's conninfo keywords (`PQconndefaults`),
  camelCased per the option-hash rule; the translation to the npm client's
  config happens inside `connect`, and npm-only keys are not valid conn params.
- No `connectionString` key remains in `packages/activerecord/src` or
  `packages/trailties/src`: test helpers resolve `PG_TEST_URL` through
  `UrlConfig` to `{ host, port, database, username, password }`.
- A test shows `newClient` raising `NoDatabaseError` for a missing database
  given a config resolved from a URL.
- `parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` green.
