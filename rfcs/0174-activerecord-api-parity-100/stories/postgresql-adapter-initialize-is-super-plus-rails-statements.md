---
title: "activerecord: PostgreSQLAdapter#initialize is super plus Rails' statements; drop the connection-string arm and the invented deprecation warning"
status: claimed
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-10T03:39:38Z"
assignee: "schema-dumper-header-branches-on-the-ts-js-dump-language"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8683, which converged `Mysql2Adapter#initialize` and left its PostgreSQL twin in the old shape.

`PostgreSQLAdapter#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:320-350`) is `def initialize(...)`, `super`, then `conn_params = @config.compact`, the `username` → `user` and `database` → `dbname` renames, the `slice(*valid_conn_param_keys)` filter, and `@connection_parameters = conn_params`, followed by the ivar defaults.

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`'s constructor (around `:538-600`) is not that:

- It takes `config: string | (pg.PoolConfig & PostgreSQLAdapterOptions)` and has a connection-string arm. Rails resolves a URL into a hash before an adapter is built (`database_configurations/url_config.rb:40-45,70-73`, `connection_url_resolver.rb:37-41`).
- Its deprecated form is `(rawConnection, deprecatedConfig)` and it calls `super({ ...deprecatedConfig })` then `_acceptDeprecatedRawConnection`. Rails' is positional `(connection, logger, connection_options, config)` handled by `AbstractAdapter#initialize` (`abstract_adapter.rb:137-149`), reached by a bare `super`.
- It raises the "should be the only argument" `ArgumentError` itself; `AbstractAdapter#initialize` already raises it (`abstract_adapter.rb:134-136`).
- It warns `RAW_CONNECTION_DEPRECATION_MESSAGE` (exported from `abstract-adapter.ts`). Rails does not warn: `abstract_adapter.rb:138` says "Soft-deprecated for now; we'll probably warn in future."
- It builds `_pgClientOptions` rather than `@connection_parameters`.

`_isDeprecatedRawConnectionArg` and `_acceptDeprecatedRawConnection` on `AbstractAdapter` (`abstract-adapter.ts` near `:2084-2093`) have PostgreSQL as their only remaining caller.

Callers to move off the string arm include `packages/trailties/src/database.ts` (`new PostgreSQLAdapter(config.url)`; the mysql arm there now resolves through `UrlConfig`) and the trails tests in `connection-adapters/raw-connection-overload.trails.test.ts`.

## Acceptance criteria

- [ ] The constructor is `super(...args)` followed by Rails' statements in Rails' order, ending in `_connectionParameters = connParams`.
- [ ] The connection-string arm is gone; callers pass a config hash, resolving a URL through `UrlConfig` / `ConnectionUrlResolver` first.
- [ ] The deprecated form is Rails' positional one through `super`, with no deprecation warning; `RAW_CONNECTION_DEPRECATION_MESSAGE`, `_isDeprecatedRawConnectionArg` and `_acceptDeprecatedRawConnection` are deleted.
- [ ] Translation the `pg` npm client needs beyond Rails' own renames happens in `newClient` (`postgresql_adapter.rb:54-76`), not in the constructor.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activerecord` show no row for the constructor.
