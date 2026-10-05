---
title: "activemodel: LazyAttributeHash / AttributeSet hash-typed members declare Record where a Marshal-loaded instance holds a Hash"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8541
claim: "2026-10-05T16:39:40Z"
assignee: "lazy-attribute-hash-ivar-types-admit-a-marshal-loaded-hash"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8534 (`marshal-loaded-lazy-attribute-hash-map-arms-in-dup-each-value-except`).
ruby-compat's `Marshal.load` answers a Ruby Hash as a `Hash` (a `Map`,
`packages/ruby-compat/src/hash.ts`), so a Marshal-loaded `LazyAttributeHash` holds a `Hash` in
`@types`, `@values`, `@additional_types`, `@default_attributes` and `@delegate_hash`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:97-104,142-148`).

PR 8534 widened only what its story touched: `LazyAttributeHash#except`, `AttributeSet#except`, and
the `defaultAttributes` of `Builder` / `LazyAttributeSet` now admit `Hash<string, Attribute>`.
The rest of `packages/activemodel/src/attribute-set/builder.ts` still declares a plain
`Record<string, …>` where a loaded instance holds a `Hash`:

- `LazyAttributeHash`'s `_delegateHash`, `types`, `values`, `additionalTypes`, `defaultAttributes`
  fields, and the `initialize` / constructor parameters and `marshalDump` tuple that carry them.
- `materialize()` and `delegateHash()` return `Record<string, Attribute>`.
- `transformValues` returns `Record<string, T>`; ruby-compat's Map arm answers a `Hash`
  (`rb_hash_transform_values`, `vendor/ruby/v3.3.11/hash.c:3366`), so `deepDup`'s
  `copy._delegateHash = transformValues(...)` stores one too.
- `AttributeSet`'s `Attributes` type (`packages/activemodel/src/attribute-set.ts`) and its
  `toHash` / `transformValues` consumers. Widening these reaches `attributeTypes()` and its
  readers across activemodel and activerecord, so they are split into
  `attribute-set-hash-returns-admit-a-marshal-loaded-hash`. `LazyAttributeSet`'s `_attributes`
  goes with them, because the base type holds it at `Record`.

The run-time behaviour is correct (every read goes through `hashAref` / `hashAset` / `fetch` /
`hasKey` / `keys`, which have Map arms); the declared types are wrong on the loaded path, so a
caller indexing `delegateHash()["name"]` on a loaded hash type-checks and reads `undefined`.

## Acceptance criteria

- [ ] Every hash-typed field, parameter and return in `attribute-set/builder.ts` that a
      Marshal-loaded instance fills with a `Hash` declares `Record<string, T> | Hash<string, T>`,
      with no cast added to satisfy a consumer. `LazyAttributeSet`'s `_attributes` is the one
      exception, left to `attribute-set-hash-returns-admit-a-marshal-loaded-hash` with
      `attribute-set.ts`.
- [ ] No bare `hash[key]` / `Object.keys(hash)` read of one of those values remains in
      activemodel `src/` (tests included: `builder-defaults.trails.test.ts` indexes
      `restored.delegateHash()["score"]`).
- [ ] `pnpm typecheck` and `pnpm test:types` stay green.
