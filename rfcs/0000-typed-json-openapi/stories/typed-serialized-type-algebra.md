---
title: "activemodel: Serialized<M, O, B> types the hash serializable_hash returns"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
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
`TypedSerializeOptions`, `TypedIncludeHash`, `JsonValue` and `Serialized`,
each with a `@noRailsEquivalent PERMANENT` receipt. A draft prototype is open
on the `typed-serialization-openapi` branch.

## Acceptance criteria

- [ ] No options gives every attribute, with base-class members excluded.
- [ ] `only` wins over `except`, and both accept a string or an array.
- [ ] `methods` adds keys under their Rails name, typed by the camelized
      member's awaited return.
- [ ] `include` (string, array, hash, or a mixed array) serializes
      associations recursively. belongs_to stays nullable, and has_many becomes an array.
- [ ] An unknown `only` / `include` key, or a nested key that's wrong for the
      target model, fails `TypedSerializeOptions`.
- [ ] No runtime code changes.

## Verification

`pnpm vitest run packages/activemodel/test/serialization-types.trails.test.ts` and
`pnpm typecheck`.
