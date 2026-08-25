---
title: "dissolve-the-postgresql-schema-statements-companion"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5844
claim: "2026-08-02T00:11:04Z"
assignee: "dissolve-the-postgresql-schema-statements-companion"
blocked-by: null
closed-reason: null
---

## Context

PR for `remove-schema-statements-dispatch-shim-companion-mixin-duality` deleted
`SchemaStatements#_adapterOverride` and made `AbstractAdapter#schemaStatements()`
return the adapter itself, so `SchemaStatements` is used one way — as the mixin
applied by `include(AbstractAdapter, SchemaStatements)`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`). MySQL was
already converged: `include(AbstractMysqlAdapter, MysqlSchemaStatements)`
(`abstract-mysql-adapter.ts:2157`) mirrors Rails'
`include MySQL::SchemaStatements`, so deleting `Mysql2Adapter#schemaStatements`
was enough.

PostgreSQL is the one adapter left out. `PostgreSQLSchemaStatements`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`,
~2000 lines, ~100 methods) is still a companion class: `PostgreSQLAdapter` carries
a thin delegator per method that forwards into
`pgSchemaStatements()` (`postgresql-adapter.ts`, now
`new PostgreSQLSchemaStatements(this)`). Rails has no such object —
`PostgreSQLAdapter` does `include PostgreSQL::SchemaStatements`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`).

The companion also has to carry a `schemaCreation` override
(`PostgreSQL::SchemaCreation.new`) that the adapter already defines, because the
base module getter is now Rails-faithful (`SchemaCreation.new(self)`) instead of
reaching back into `this.adapter`.

## Acceptance criteria

- `PostgreSQL::SchemaStatements` is mixed into `PostgreSQLAdapter` the way
  `MySQL::SchemaStatements` is mixed into `AbstractMysqlAdapter`, with the method
  bodies staying in `postgresql/schema-statements-class.ts` (the Rails layout file
  parity:api matches against).
- The per-method delegators on `PostgreSQLAdapter` and the private
  `pgSchemaStatements()` accessor are deleted; overrides reach the base bodies via
  plain `super`.
- `PostgreSQLSchemaStatements`' `schemaCreation` override goes away — the
  adapter's own getter is what the mixed-in bodies hit.
- The PG suites stay green; existing `schema-statements-class.test.ts` /
  `.trails.test.ts` cases are re-pointed at the adapter rather than renamed.
- Likely more than one PR at the 500-LOC ceiling; split by method cluster
  (indexes / constraints / enums+ranges / sequences), each from `main` with
  non-overlapping files.
