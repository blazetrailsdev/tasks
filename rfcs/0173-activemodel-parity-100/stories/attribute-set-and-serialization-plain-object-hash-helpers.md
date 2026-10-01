---
title: "activemodel: frozenErrorRaisingStore and safeSet go when the Hash stand-in holds frozen state and any key"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`. Two module-private helpers exist only because
a plain JS object stands in for a Ruby `Hash`, each under a `@noRailsEquivalent PERMANENT` receipt the
extractor never reads (`pnpm parity:api:receipts --package activemodel` lists both as unverifiable):

- `frozenErrorRaisingStore` (`packages/activemodel/src/attribute-set.ts`) — a `Proxy` over
  `@attributes` so a write to a frozen store raises `FrozenError: can't modify frozen Hash`, as
  `AttributeSet#freeze` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:68-71`,
  `attributes.freeze`) makes `[]=` (`:20-22`) do. It is applied at `initialize` (`:12-14`),
  `initialize_dup` (`:77-80`) and `initialize_clone` (`:82-85`), none of which wrap anything in Rails.
- `safeSet` (`packages/activemodel/src/serialization.ts`) — `Object.defineProperty` in place of
  `hash[m.to_s] = send(m)` / `hash[association.to_s] = …`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb:138,141`) and of `index_with`
  (`:175`), so a key named `__proto__` is stored rather than re-parenting the object.

Both are properties of the stand-in, not of TypeScript: ruby-compat's `Hash`
(`packages/ruby-compat/src/hash.ts`) carries a `#frozen` seat and stores any key.
`activemodel-score-core-object-freeze-and-initialize-clone` (this RFC) ports `AttributeSet#freeze`
itself and should land on the same store.

## Acceptance criteria

- [ ] `AttributeSet`'s `@attributes` is a store whose `[]=` raises `FrozenError` when frozen without a wrapping Proxy; `frozenErrorRaisingStore` is deleted and `initialize` / `initialize_dup` / `initialize_clone` read as `attribute_set.rb:12-14,77-85`.
- [ ] `serializable_hash` / `serializable_attributes` / `serializable_add_includes` assign with the Rails `hash[k] = v` shape onto a store that holds a `__proto__` key; `safeSet` is deleted.
- [ ] `packages/activemodel/src/attribute-set.test.ts` and `serialization.test.ts` green, including the frozen-write and `__proto__` cases.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activemodel/src/attribute-set.test.ts packages/activemodel/src/serialization.test.ts
```
