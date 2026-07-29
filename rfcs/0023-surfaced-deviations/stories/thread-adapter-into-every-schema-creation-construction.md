---
title: "Drop the host-less SchemaCreation path and its native-type fallback table"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SchemaCreation` is always constructed with a live connection —
`SchemaCreation.new(conn)` (`abstract/schema_creation.rb`) — and delegates
`type_to_sql`, quoting and every capability probe to that `@conn`. trails also
supports an **adapter-less** construction from a bare adapter _name_:

- `packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts:208`
  — `new SchemaCreation("sqlite")`
- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
  — falls back to `new SchemaCreation(this.adapterName, this.adapter)` where
  `this.adapter` may be a bare `SchemaQuoter` with no
  `nativeDatabaseTypes()`.

This has no Rails counterpart and it forces a compensating invention. PR #5570
made `typeToSql` source its base names from
`native_database_types[type][:name]` (`abstract/schema_statements.rb:1385-1415`),
which needs the hash — so the host-less path required
`NATIVE_DATABASE_TYPES_BY_ADAPTER` in
`connection-adapters/abstract/native-database-types.ts`, a name-keyed fallback
table that exists purely for callers with no adapter. PostgreSQL then needed a
second compensation on top: `postgresql/schema-creation.ts` overrides the
`nativeDatabaseTypes()` hook so the host-less path still resolves `datetime`
through `datetime_type` the way `PostgreSQLAdapter#native_database_types`
(`postgresql_adapter.rb:404-408`) does.

Thread the adapter at every construction site and both compensations delete
themselves.

## Acceptance criteria

- [ ] Every `SchemaCreation` construction threads a real adapter, matching
      `SchemaCreation.new(conn)`; the name-only constructor arm is removed or
      made private to a documented test seam.
- [ ] `NATIVE_DATABASE_TYPES_BY_ADAPTER` and the `?? fallback` in
      `SchemaCreation#nativeDatabaseTypes` are deleted; the hook reads
      `this.adapter.nativeDatabaseTypes()` unconditionally.
- [ ] The three exported per-adapter constants stay where they are — each
      adapter's `nativeDatabaseTypes()` is still their only consumer.
- [ ] Unit tests that construct a host-less visitor are migrated to a real (or
      fully stubbed) adapter rather than deleted.
- [ ] No test:compare or api:compare regression.
