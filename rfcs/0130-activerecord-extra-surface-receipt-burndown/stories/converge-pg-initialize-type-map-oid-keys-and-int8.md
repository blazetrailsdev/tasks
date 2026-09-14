---
title: "converge-pg-initialize-type-map-oid-keys-and-int8"
status: closed
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: "converged in trails#7748 per review"
---

## Context

`PostgreSQLAdapter.initializeTypeMap` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, moved there by trails#7748) mirrors `postgresql_adapter.rb:676-738`, but keeps two trails-only divergences inherited from the deleted `type-map-init.ts`:

- `m.registerType(18, new StringType())` / `m.registerType(19, ...)`: Rails registers no OID keys here; `char`/`name` OIDs arrive via `load_additional_types` (`postgresql_adapter.rb:751`). Added in #792.
- `PgInteger8` registered for `int8` where Rails uses `Type::Integer.new(limit: 8)` (`:679`); it overrides `serialize`/`serializeCastValue` for BigInt range handling (#4240).
- Because of the OID keys, the static takes `TypeMap | HashLookupTypeMap` and casts.

## Acceptance criteria

- `int8` registers `IntegerType({ limit: 8 })`; whatever range behavior #4240 needed lives in activemodel `Type::Integer`.
- The OID 18/19 registrations are removed; PG lane stays green through `load_additional_types`.
- The static's parameter is `HashLookupTypeMap`-shaped without casts, or a TS override-variance note is cited.
