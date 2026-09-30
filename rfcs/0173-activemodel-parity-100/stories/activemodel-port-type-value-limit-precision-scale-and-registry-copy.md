---
title: "activemodel: Type::Value's limit / precision / scale readers and Type::Registry#initialize_copy"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: api-surface
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Of activemodel's **17** `parity:api` misses (793/810), the ones no other story owns:

- `ActiveModel::Type::Value#precision`, `#scale`, `#limit` — `attr_reader :precision, :scale, :limit`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/value.rb:11`). `parity:api` reports all three as **DeclOnly**: trails'
  `packages/activemodel/src/type/value.ts` declares them without a body the extractor pairs, so they
  score as missing.
- `ActiveModel::Type::Registry#initialize_copy` — `vendor/rails/v8.0.2/activemodel/lib/active_model/type/registry.rb:10`
  (`@registrations = @registrations.dup`); `packages/activemodel/src/type/registry.ts` has none, so a
  dup'd registry shares its registration table.

Owned elsewhere, and wired as deps of `activemodel-parity-100-close-out`: `eql?`/`hash` on
`attribute.rb`, `error.rb`, `type/value.rb` (`port-hash-eql-rows-surfaced-by-scoring`, RFC 0156);
the six `naming.rb` rows (`port-non-accessor-rows-from-level-keyed-set`, RFC 0156);
`AttributeSet#to_h` (`attribute-set-to-h-alias-unported`, RFC 0082).

## Acceptance criteria

- [ ] `limit`/`precision`/`scale` are real readers over the ivars `Value#initialize` sets, credited by `parity:api` (no DeclOnly rows in `type/value.rb`).
- [ ] `Registry#initializeCopy` dups the registrations, and `dup()` on a registry calls it; a unit test mirrors the behaviour `type/registry_test.rb` relies on.
- [ ] `pnpm parity:api` activemodel misses drop by 4, and `pnpm parity:api:pins` pins the new pairs.

## Verification

```bash
pnpm parity:api && pnpm vitest run packages/activemodel/src/type
```
