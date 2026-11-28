---
title: "activemodel: Serialized<M, O, B> types the hash serializable_hash returns"
status: draft
updated: 2026-11-27
rfc: "0261-typed-json-openapi"
cluster: typed-serialization
packages: [activemodel]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 1. `SerializeOptions` (`packages/activemodel/lib/serialization.ts:118`)
types its keys as `string`, so nothing computes the hash's shape. This story adds
types only: `AttributeKeys`, `AssociationKeys`, `AssociationTarget`,
`TypedSerializeOptions`, `TypedIncludeHash`, `MethodNames`, `Serialized` (the raw
`serializable_hash` shape), `JsonValue` and `SerializedJson` (the `as_json` shape),
each with a `@noRailsEquivalent PERMANENT` receipt. The prototype is blazetrailsdev/trails#10860.

## Acceptance criteria

- [ ] No options gives every attribute, with base-class members excluded.
- [ ] `only` wins over `except`, and both accept a string or an array.
- [ ] `Serialized` keeps raw values (`Date`, `bigint`), and `SerializedJson` encodes them
      (`string`) in the encoder's order, `asJson` before `toJSON`.
- [ ] `methods` adds keys under their Rails name for any member the runtime `send`s,
      readers included (`full_name` → `fullName()`, `admin?` → `isAdmin()`). A method's
      return is unawaited, as the runtime stores it, and an unknown name fails
      `TypedSerializeOptions`.
- [ ] A nil `only:` falls through to `except:`.
- [ ] `include` (string, array, hash, or a mixed array) serializes
      associations recursively. A nil-able singular association is an optional key
      (`serializable_add_includes` skips nil), and has_many becomes an array.
- [ ] An unknown `only` / `include` key, or a nested key that's wrong for the
      target model, fails `TypedSerializeOptions`.
- [ ] No runtime code changes.

## Verification

`pnpm vitest run packages/activemodel/test/serialization-types.trails.test.ts` and
`pnpm typecheck`.
