---
title: "activerecord: build_fixture_sql drops its typeMap verify guard and optional-host fallbacks"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8707
claim: "2026-10-09T13:24:04Z"
assignee: "type-virtualization-leaves-the-activerecord-rails-matched-tree"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`.

Rails' `build_fixture_sql`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:607-648`)
opens with `columns = schema_cache.columns_hash(table_name).reject { ... }`.

trails' `buildFixtureSql`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1123`) opens with
`if (this.typeMap == null) await this.verifyBang?.();`, a guard Rails does not have. It exists because
`lookupCastTypeFromColumn` is synchronous and PostgreSQL's type map is only loaded once the connection has
been verified. `pnpm parity:api:arms:report --package=activerecord --direction=invented` reports `+if` for
the pair. The body also reads `this.supportsVirtualColumns?.()`, `this.defaultInsertValue ?? defaultInsertValue`
and `(this as any)?.visitor ?? new Visitors.ToSql(...)`, optional-host fallbacks Rails does not have.

## Acceptance criteria

- [ ] The `typeMap` / `verifyBang` guard is gone from `buildFixtureSql`. The type map is loaded by the step
      that hands the fixture loader its connection.
- [ ] The optional-host fallbacks are replaced by plain calls on the adapter, as Rails' body makes them.
- [ ] The invented-direction arms report has no `database-statements.ts#buildFixtureSql` row.
- [ ] The fixture suites pass on every adapter lane.
