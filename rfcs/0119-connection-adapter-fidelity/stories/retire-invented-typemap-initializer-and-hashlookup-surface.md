---
title: "Delete TypeMapInitializer#runInitializer and HashLookupTypeMap#has — invented surface with no Rails counterpart"
status: done
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7277
claim: "2026-08-31T00:14:13Z"
assignee: "time-ext-rubytime-arms-delegate-to-time-reopening"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/type-map-initializer.ts`
carries two public names with no counterpart in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/type_map_initializer.rb`,
plus one on the store class it now types against (#7095 converged that store
onto the ported `Type::HashLookupTypeMap` and removed the local stand-in
interface, which is what left these visible).

1. **`runInitializer`** (`:76-78`) is a one-line wrapper that calls `run`:

   ```ts
   runInitializer(records: PgTypeRow[]): void {
     this.run(records);
   }
   ```

   Rails has `run` and nothing else — `type_map_initializer.rb:19` is the only
   entry point, and `postgresql_adapter.rb`'s `load_additional_types` calls
   `initializer.run(records)` directly. `grep -rn 'runInitializer' packages/`
   finds only the declaration: nothing in the repo calls it, including the
   tests.

2. **`HashLookupTypeMap#has`** (`type/hash-lookup-type-map.ts:112-114`)
   duplicates `isKey` (`:108-110`), which is the port of Rails' `key?`
   (`type/hash_lookup_type_map.rb:41-43`). Rails declares `key?` and no
   synonym. `isKey` already delegates to `has`, so one of the two is pure extra
   surface — and it is `has`, since `isKey` is the name the convention table
   produces from `key?`.

Neither is a language shortcoming; both are invented convenience surface, which
is what `parity:api:extra` measures.

## Converged shape

Delete `runInitializer` outright — it has no callers, so this is pure removal.

Collapse `has` into `isKey`: move the `_mapping.has(key)` body into `isKey` and
delete `has`, then repoint its callers. Check the call sites first —
`type-map-initializer.ts` reads the store through `isKey` after #7095, but
`postgresql-adapter.ts` calls `this.typeMap.has(oid)` at `:965` and `:1139`,
and those are the ones to flip. Rails spells both `@type_map.key?(oid)`
(`postgresql_adapter.rb`, `get_oid_type` / the missing-oid scan), so `isKey` is
the faithful spelling at every one.

## Acceptance criteria

- [ ] `runInitializer` is gone from `type-map-initializer.ts`.
- [ ] `HashLookupTypeMap` exposes `isKey` only; `has` is gone and every caller
      (including `postgresql-adapter.ts:965,1139`) reads `isKey`.
- [ ] `pnpm parity:api:extra --package activerecord` novel/total both drop;
      narrow the mark with `pnpm parity:api:extra:tighten` (never a reseed).
- [ ] PostgreSQL lane green.
