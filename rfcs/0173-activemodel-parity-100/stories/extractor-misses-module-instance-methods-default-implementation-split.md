---
title: "extractor does not see a Module instance's methods, so DefaultImplementation is split in two"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8366 (`activemodel-burn-extra-surface-to-zero`).

`ActiveModel::Type::SerializeCastValue::DefaultImplementation`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb:15-19`) is one module, included
above the class by `self.included` (`:21-23`), which is what makes `Type::Value.serialize_cast_value_compatible?`
false (`:9-12`).

In `packages/activemodel/src/type/serialize-cast-value.ts` it is two values: an exported object literal
`DefaultImplementation` holding the method, and a module-private `defaultImplementation = new Module().include(DefaultImplementation)`
that `[included]` actually includes. The split exists only because `scripts/api-compare/extract-ts-api.ts`
harvests `export const X = { ... }` as a module and does not see the methods of
`export const X = new Module().include({ ... })` or of `new Module((mod) => mod.defineMethod(...))`, so the
single-value shape scored `DefaultImplementation#serialize_cast_value` as missing. The same blind spot covers
`CoreQueries.ClassMethods` in `packages/activerecord/src/encryption/extended-deterministic-queries.ts`.

## Converged shape

The extractor credits the methods a `Module` instance is built with, and `DefaultImplementation` is the one
live `Module` that `[included]` includes; the private wrapper is deleted.

## Acceptance criteria

- [ ] `extract-ts-api.ts` records the methods of an exported `Module` instance built with `.include({ ... })` or `defineMethod`, with a test.
- [ ] `serialize-cast-value.ts` exports one `DefaultImplementation` and has no `defaultImplementation` wrapper.
- [ ] `pnpm parity:api` keeps `type/serialize_cast_value.rb` at 5/5; `ValueType.serializeCastValueCompatible()` stays `false`.
