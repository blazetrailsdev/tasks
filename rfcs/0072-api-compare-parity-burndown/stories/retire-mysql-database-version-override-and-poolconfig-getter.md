---
title: "Retire the MySQL databaseVersion override and PoolConfig#serverVersion's getter shape"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6150
claim: "2026-08-06T01:53:06Z"
assignee: "route-temporal-imports-activerecord"
blocked-by: null
closed-reason: null
---

## Context

Two deviations left standing by #6144, both in the pool/adapter version surface.

1. `AbstractMysqlAdapter#databaseVersion`
   (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`,
   just below `isMariadb`) exists only to narrow the base getter's
   `Version | number` to `Version`; its body is `super.databaseVersion as Version`.
   Rails has no MySQL override — `abstract_adapter.rb:854-856` answers whatever
   `get_database_version` returned, and `abstract_mysql_adapter.rb:86-90` makes
   that a `Version`. The override is pure TS scaffolding: a member Rails does
   not have, that `parity:api:extra` counts.

2. `PoolConfig#serverVersion`
   (`packages/activerecord/src/connection-adapters/pool-config.ts`) is a getter
   returning a callable rather than a method, because Ruby carries both
   `server_version(connection)` (`pool_config.rb:39-41`) and
   `attr_writer :server_version` (`pool_config.rb:9`) under one name and TS
   cannot. Callers read `poolConfig.serverVersion(conn)`, so the call shape is
   right, but the declaration is not a method and the lint/manifest sees a
   getter where Rails has a method.

## Converged shape

- Type the version surface so `databaseVersion` answers the adapter's own
  version type without a redeclaring override — e.g. a generic/`this`-typed
  return on `AbstractAdapter`, or per-adapter declaration merging — and delete
  the MySQL override.
- Spell `PoolConfig#serverVersion` as a method and give the writer Rails' own
  name via a separate setter path (`setServerVersion`, the settled trails idiom
  for a Ruby writer whose reader is a method), so the reader matches
  `pool_config.rb:39-41` in kind as well as in call shape.

## Acceptance criteria

- [ ] `AbstractMysqlAdapter#databaseVersion` is gone; MySQL version gates still
      read a `Version` without a cast at the call sites.
- [ ] `PoolConfig#serverVersion` is a method, and its writer keeps the Rails
      name.
- [ ] `pnpm parity:api:extra --package activerecord` loses both names; no new
      `@noRailsEquivalent` tag is added in their place.
- [ ] All adapter lanes green.
