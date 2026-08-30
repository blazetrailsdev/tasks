---
title: "pg-eager-load-additional-types-duplicates-the-rails-loader"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one type loader. `load_additional_types`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:867-873`)
builds a `TypeMapInitializer`, walks `load_types_queries`, and runs each result
through `internal_execute(query, "SCHEMA", [], allow_retry: true,
materialize_transactions: false)`. It is reached lazily from
`initialize_type_map` (`:744-751`). `configure_connection` (`:956-985`) does
**not** load types at all.

trails carries a second copy. `PostgreSQLAdapter#_eagerLoadAdditionalTypes`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:503-512`)
duplicates `loadAdditionalTypes`' body — same `loadTypesQueries` loop, same
`initializer.run(records)` — but issues each query against the raw `pg.Client`
(`client.query(query)`) instead of `internalExecute`, and is called from
`configureConnection` (`:497-500`) behind a `_typeMapEagerLoaded` flag that has
no Rails counterpart, after a `this._typeMap = null` reset that Rails also does
not do. Six sites reset `_typeMapEagerLoaded` (`:344, :858, :1488, :1508,
:1569, :1597, :1616`).

The duplication is not inert. PR #7257 added a `sql_type` -> OID table for
`lookup_cast_type` (postgresql/quoting.rb:194-196) and populated it in
`loadAdditionalTypes` — the loader that mirrors Rails. The live connect path
runs the _copy_, so the table stayed empty on a real connection and the
by-OID lookup silently fell back to the name string; caught only by a PG-lane
CI failure on `lookup-cast-type.trails.test.ts`'s schema-qualified case. #7257
routes both loaders through one private `_captureRegtypeOids`, which fixes the
symptom and leaves the duplication.

The copy exists for a bootstrapping reason, not a preference:
`configureConnection` runs mid-connect, where `internalExecute` would re-enter
the adapter's lock and the not-yet-configured-connection guard. That constraint
is what needs converging, not the loader body.

## Converged shape

One `loadAdditionalTypes`, mirroring `postgresql_adapter.rb:867-873`, reached
lazily from `initializeTypeMap` as Rails reaches it. Establish first whether the
eager load during `configureConnection` is needed at all — Rails has no eager
load, so the lazy path plus `_typeMapEagerLoaded`'s removal may be the whole
change. If the eager call must stay, it calls the one `loadAdditionalTypes`
rather than duplicating it, with whatever connect-time re-entrancy escape
`internalExecute` needs justified at that call site with its Rails `file:line`.

Related: `pg-lookup-cast-type-resolves-by-name-not-regtype-oid` (RFC 0119, PR
#7257) is what surfaced this.

## Acceptance criteria

- [ ] `_eagerLoadAdditionalTypes` is gone; one loader mirrors
      `postgresql_adapter.rb:867-873`.
- [ ] `_typeMapEagerLoaded` and its seven reset sites go with it, or each
      survivor is justified at its call site with a Rails cite.
- [ ] `_captureRegtypeOids` has one caller.
- [ ] PG lane green (`ARCONN=postgresql`), including
      `lookup-cast-type.trails.test.ts`'s schema-qualified case.
