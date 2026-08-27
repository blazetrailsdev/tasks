---
title: "OID::Array's subtype map is optional only to fit test doubles"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `OID::Array#map` calls its subtype's `map` unguarded
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb:66-68`):

```ruby
def map(value, &block)
  value.is_a?(::Array) ? value.map(&block) : subtype.map(value, &block)
end
```

It can, because every `Type::Value` answers `map` — the base defines it at
`vendor/rails/activemodel/lib/active_model/type/value.rb:117-119`.

trails cannot, only because of its own test doubles. `ArraySubtype`
(`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`)
declares `map?` optional, and `Array#map` reaches it through a non-null
assertion:

```ts
map(value: unknown, block: (value: unknown) => unknown): unknown {
  return globalThis.Array.isArray(value)
    ? value.map((element) => block(element))
    : this.subtype.map!(value as never, block);
}
```

PR #7136 tried making the member required and typecheck reported 11 call sites
across four files that hand `Array` an object literal with no `map`:
`adapters/postgresql/array.test.ts:488-489`,
`connection-adapters/postgresql/oid/array-deserialize.trails.test.ts:19,25,31`,
`connection-adapters/postgresql/oid/array.trails.test.ts:14,20,26,36,42,57,64,79`,
and one production caller, `postgresql/oid/type-map-initializer.ts:124`, whose
`OidSubtype` is likewise missing `map`. The optionality was kept rather than
widen that into #7136's scope; this is the story that closes it.

This is the duck-typed-widening-props-up-test-doubles shape: the production
type is weakened to fit hand-rolled doubles, and the `!` then hides a real
`undefined` from `type-map-initializer.ts`.

## Converged shape

- `ArraySubtype.map` is required, matching every `Type::Value` answering
  `map` (`value.rb:117-119`), and `Array#map` calls it with no `!`.
- `OidSubtype` in `postgresql/oid/type-map-initializer.ts` gains `map` too, or
  is narrowed to a type that already has it.
- The test doubles become real `Type::Value`s (or extend one) rather than bare
  object literals, so they inherit `map` the way Rails' do. Do NOT re-widen
  the interface to keep a literal compiling.

## Acceptance criteria

- [ ] `ArraySubtype.map` is a required member and `oid/array.ts#map` carries no
      non-null assertion.
- [ ] `postgresql/oid/type-map-initializer.ts:124` typechecks without a cast.
- [ ] The four test files above construct subtypes that genuinely answer `map`.
- [ ] PG `array` / `oid` suites and `pnpm typecheck` stay green.
