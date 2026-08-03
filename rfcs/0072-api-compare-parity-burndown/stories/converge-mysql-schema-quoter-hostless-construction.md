---
title: "Converge MySQL's host-less schema quoter onto a required adapter"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5944
claim: "2026-08-03T01:25:47Z"
assignee: "converge-mysql-schema-quoter-hostless-construction"
blocked-by: null
closed-reason: null
---

## Context

`mysqlSchemaQuoter(host?)`
(`packages/activerecord/src/connection-adapters/mysql/schema-quoter.ts:26`) and
`MySQL::SchemaCreation`'s optional-host constructor
(`connection-adapters/mysql/schema-creation.ts:78`) are the last adapter-free
schema-quoting path in trails. Every method of the returned quoter falls back to
the dialect's standalone helpers when no host is threaded, and
`quoteDefaultExpression` is bound to a host with no type map, so a default value
quoted through it silently skips `serialize`.

Rails has no such object: `MySQL::SchemaCreation` inherits
`SchemaCreation#initialize(conn)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:6`)
and quoting is always the live adapter's.

PR #5938 (story `converge-schema-creation-adapter-free-construction`) deleted
the sibling `ABSTRACT_SCHEMA_QUOTER` and made the abstract/PG/SQLite3
`SchemaCreation` + `TableDefinition` constructors require a real adapter,
threading one into the DDL-rendering unit tests via `support/schema-conn.ts`.
The MySQL host was explicitly left out of that PR's scope. The same technique
applies here: `mysql/schema-creation.test.ts` constructs `new SchemaCreation()`
host-less in several places and can take `schemaConn("mysql")` instead.

Related: `adapterless-schema-quoters-force-lookup-cast-type-guards`
(0023-surfaced-deviations) covers the guards in
`abstract/quoting.ts#quoteDefaultExpression` / `lookupCastTypeFromColumn` that
exist only for these adapter-less hosts — with the MySQL quoter converged, those
guards can go too, so the two should probably be scheduled together.

## Acceptance criteria

- `MySQL::SchemaCreation`'s constructor requires its host, and
  `mysqlSchemaQuoter` requires the host it binds.
- No standalone-helper fallbacks remain in `mysqlSchemaQuoter`.
- `mysql/schema-creation.test.ts` and any other host-less construction sites
  pass a real MySQL adapter (`schemaConn("mysql")`).
- activerecord novel count does not increase.
