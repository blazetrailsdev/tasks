---
title: "activerecord: PG load_additional_types runs a fourth query and fills a regtype OID map Rails does not have"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of trails#8491.

Rails' `load_additional_types`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:867-873`)
runs each query `load_types_queries` yields and hands the records to `initializer.run`.
`load_types_queries` (`:875-885`) yields one query when `oids` is given and three otherwise.

The port (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) makes two calls Rails
does not:

- `loadTypesQueries` yields a fourth query in the no-OID arm, `nativeTypeNamesQuery()`, which resolves
  every `native_database_types` name (and its array form) through `to_regtype`.
- `loadAdditionalTypes` calls `_captureRegtypeOids(records)` before `initializer.run(records)`, filling
  the `_regtypeOids` map from each row's `typname` / `formatType` / `aliasName`.

The only reader of `_regtypeOids` is `postgresql/quoting.ts:314`, which answers a type name's OID
without a query. Both were added in trails#7189 ("quote_default_expression returns a String"), so the
map stands in for a lookup Rails makes in line. Find the Rails call it replaces before deciding
whether the map stays.

## Acceptance criteria

- [ ] `loadTypesQueries` yields Rails' one or three queries and `loadAdditionalTypes` passes the records straight to `initializer.run`, or each extra call carries an `@inventedArm <call> — PERMANENT` receipt citing the ratified shortcoming that forces it.
- [ ] The PostgreSQL adapter suite stays green.
