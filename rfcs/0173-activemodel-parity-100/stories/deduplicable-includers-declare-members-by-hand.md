---
title: "activerecord: Column and SqlTypeMetadata declare Deduplicable's members by hand instead of through Included<>"
status: draft
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since trails PR 8465 a live `Module`'s instance methods are named in its type parameter
(`Module<I>`, `packages/ruby-compat/src/include.ts`) and read by `Included<>`.
`Deduplicable` (`packages/activerecord/src/connection-adapters/deduplicable.ts`) declares
`deduplicate`, `negate` and `deduplicated` there, mirroring
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:18-27`.

Its two includers still declare the members by hand instead of through the include:
`column.ts:10-11` and `sql-type-metadata.ts:8-9` carry `declare deduplicate: typeof
deduplicate` / `declare negate: typeof deduplicate`, where Rails has only
`include Deduplicable` (`column.rb:8`, `sql_type_metadata.rb:7`). PR 8465 converged the same
shape for `ValueType` / `SerializeCastValue` after the hand-written member broke the
virtualized DX type tests (TS2320).

## Acceptance criteria

- [ ] `Column` and `SqlTypeMetadata` take `deduplicate` / `negate` through
      `interface X extends Included<typeof Deduplicable>`; the hand-written `declare` lines
      are deleted.
- [ ] `pnpm typecheck`, `pnpm test:types` and `pnpm test:types:virtualized` are green.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.

## Verification

```bash
pnpm typecheck && pnpm test:types:virtualized
```
