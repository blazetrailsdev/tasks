---
title: "activerecord: PG TypeMapInitializer#run, lookup_cast_type_from_column and type_cast drop their invented arms"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-1`.
`pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/postgresql/oid/type-map-initializer.ts#run` — `+loop`
- `connection-adapters/postgresql/quoting.ts#lookupCastTypeFromColumn` — `+throw`

and one pair the report folds away but which is still an invented arm:

- `connection-adapters/postgresql/quoting.ts#typeCast` — two `value === DateInfinity` /
  `value === DateNegativeInfinity` arms ahead of Rails' `case`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/`):

- `oid/type_map_initializer.rb:15-32` — `run` ends after `composites.each`. The port adds
  `records.forEach((row) => this.registerSqlTypeName(row))`, which feeds the name→oid table
  `lookupCastType` reads in place of Rails' live `SELECT ...::regtype::oid` (`quoting.rb:195-197`).
  That is the debt `pg-lookup-cast-type-resolves-only-warmed-type-names` (blocked, RFC 0123) tracks;
  the loop goes when that story lands.
- `quoting.rb:189-192` — `verify! if type_map.nil?`. The port throws `ConnectionNotEstablished`
  instead, because `lookupCastTypeFromColumn` is synchronous and `verify!` is async.
  `pg-lookup-cast-type-from-column-verify-arm-in-quoting` is marked done and the throw is still there.
- `quoting.rb:169-187` — `type_cast` has no infinity arm: Rails' date infinity is `Float::INFINITY`, which
  reaches `super` as a Numeric. trails' `DateInfinity` / `DateNegativeInfinity` are activemodel sentinels,
  so the PG body maps them to `"infinity"` / `"-infinity"` by hand.

## Acceptance criteria

- [ ] `TypeMapInitializer#run` has Rails' six loops and no seventh.
- [ ] `lookupCastTypeFromColumn` takes Rails' `verify! if type_map.nil?` arm and raises nothing itself.
- [ ] `typeCast` has Rails' five `when` arms and no sentinel arms.
- [ ] The invented-direction report shows 0 rows for these pairs.
