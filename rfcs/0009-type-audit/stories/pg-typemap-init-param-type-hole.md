---
title: "Remove HashLookupTypeMap cast in PG static initializeTypeMap (reconcile with base TypeMap)"
status: in-progress
updated: 2026-06-23
rfc: "0009-type-audit"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 5
pr: 4023
claim: "2026-06-23T17:30:10Z"
assignee: "pg-typemap-init-param-type-hole"
blocked-by: null
---

## Context

`PostgreSQLAdapter.initializeTypeMap` (the static class method,
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:713`)
launders its argument through a double cast:

```ts
static initializeTypeMap(m: TypeMap): void {
  staticInitializeTypeMap(m as unknown as HashLookupTypeMap);
}
```

The `as unknown as HashLookupTypeMap` is the type hole this story removes. It
exists because the base static signature is
`AbstractAdapter.initializeTypeMap(m: TypeMap)`
(`connection-adapters/abstract-adapter.ts:1891`) — a `TypeMap` — while the PG
seeder (`postgresql/type-map-init.ts:133`, `initializeTypeMap(m: HashLookupTypeMap)`)
needs the `HashLookupTypeMap`-specific surface (string|number keys + the
`(fmod, sql_type)` varargs `fetch`, `type-map-init.ts:235`). Narrowing the PG
override's param to `HashLookupTypeMap` would be a contravariant violation of
the base method, so the author widened it to `TypeMap` and cast back inside.

The root cause is a fidelity divergence: in trails,
`HashLookupTypeMap` (`type/hash-lookup-type-map.ts:9`) is a **standalone class**
that does NOT extend `TypeMap` (`type/type-map.ts:6`) — the two classes
duplicate `lookup` / `fetch` / `performFetch` with incompatible signatures. In
Rails, `ActiveRecord::Type::HashLookupTypeMap < TypeMap`
(`activerecord/lib/active_record/type/hash_lookup_type_map.rb`) — it inherits.
If trails mirrored that inheritance, `HashLookupTypeMap` would be assignable to
`TypeMap`, the base/override signatures would be sound, and the `as unknown as`
laundering would be unnecessary.

Other consumers that currently rely on the standalone `HashLookupTypeMap`
typing (must keep compiling after the change): `postgresql-adapter.ts:343/725`
(`_typeMap` field + `typeMap` getter), `postgresql/type-map-init.ts` (all
seeders), `postgresql/schema-statements-class.ts:63` (`readonly typeMap`).

## Acceptance criteria

- [ ] `HashLookupTypeMap` extends `TypeMap` (mirroring Rails
      `HashLookupTypeMap < TypeMap`), reconciling the duplicated
      `lookup`/`fetch`/`performFetch` so the subclass's string|number-key +
      `(fmod, sql_type)` varargs surface is a sound specialization of the base.
- [ ] The `as unknown as HashLookupTypeMap` double cast in
      `PostgreSQLAdapter.initializeTypeMap` (postgresql-adapter.ts:714) is
      removed; the static override is type-sound against the base
      `AbstractAdapter.initializeTypeMap(m: TypeMap)` signature.
- [ ] No new `any`/`unknown` cast is introduced to paper over the change
      (this is a type-audit story — the hole must close, not move).
- [ ] PG type-map tests stay green
      (`postgresql-adapter.type-map.test.ts`, `postgresql/type-map-init.test.ts`),
      plus the base `type/type-map.test.ts` / `hash-lookup-type-map.test.ts`.
- [ ] `pnpm tsc --build` clean; api:compare + test:compare deltas non-negative.
