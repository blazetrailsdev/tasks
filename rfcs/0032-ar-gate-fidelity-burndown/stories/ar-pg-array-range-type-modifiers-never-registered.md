---
title: "ar-pg-array-range-type-modifiers-never-registered"
status: done
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5203
claim: "2026-07-24T01:22:14Z"
assignee: "ar-pg-array-range-type-modifiers-never-registered"
blocked-by: null
closed-reason: null
---

## Context

Rails registers the two PostgreSQL type modifiers at
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1166-1167`:

```ruby
ActiveRecord::Type.add_modifier({ array: true }, OID::Array, adapter: :postgresql)
ActiveRecord::Type.add_modifier({ range: true }, OID::Range, adapter: :postgresql)
```

so `attribute :my_array, :string, limit: 50, array: true` resolves to
`OID::Array.new(Type::String.new(limit: 50))` — a distinct wrapper class
(`vendor/rails/activerecord/test/cases/attributes_test.rb:254-266`).

trails has every piece except the wiring:

- `AdapterSpecificRegistry#addModifier` / `DecorationRegistration` exist
  (`packages/activerecord/src/type/adapter-specific-registry.ts:159,197-227`)
  but are exercised only by `adapter-specific-registry.test.ts`.
- `OID::Array` is implemented
  (`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`).
- `packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts`
  registers the 11 scalar OID types but never calls `addModifier` for either
  `{ array: true }` or `{ range: true }`.

Since #5196, `attribute()` forwards `array` / `range` (declared on
`AttributeOptions`, `packages/activemodel/src/attributes.ts:99-107`) into
`resolveTypeName` -> `Type.lookup`. With no `DecorationRegistration` present,
`findRegistration` matches only the plain `"string"` registration and
`Registration.call` (adapter-specific-registry.ts:42-46) strips just `adapter`,
so `array: true` rides into `new StringType({ limit: 50, array: true })` and is
silently dropped by the constructor. The declared type is a bare `StringType`,
never an `OID::Array`.

`packages/activerecord/src/attributes.test.ts:348-365` only asserts
`stringArray !== intArray`, which passes off the base-type/limit difference
alone, so CI does not catch this.

## Acceptance criteria

- `type-map-init.ts` calls `Type.addModifier({ array: true }, OidArray, ...)`
  and the `{ range: true }` equivalent, mirroring postgresql_adapter.rb:1166-1167.
- `OID::Range` exists (port it if missing) or the range modifier is deferred with
  a stated reason.
- `attribute("my_array", "string", { limit: 50, array: true })` on a PG model
  yields an `OID::Array` wrapping a `StringType` with `limit` 50; a real fidelity
  assertion replaces the `!==` check in `attributes.test.ts:348-365`, matching
  `attributes_test.rb:254-266`.
- Decide the adapter scoping alongside
  `ar-pg-oid-type-registrations-not-adapter-scoped` — Rails scopes these
  modifiers to `adapter: :postgresql`, and that story covers why the scalar
  registrations are currently unscoped in trails.
- PG CI green (`adapters/postgresql/array.test.ts`, `range.test.ts`).
