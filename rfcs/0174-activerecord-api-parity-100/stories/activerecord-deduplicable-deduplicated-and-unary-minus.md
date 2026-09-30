---
title: "activerecord: Deduplicable#deduplicated, the -@ alias, and the six inlined deduplicable bodies"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three measurements point at the same shape in `connection_adapters/deduplicable.rb`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb`):

- `parity:api` — `deduplicable.rb` scores 3/4 with `deduplicated` **DeclOnly**
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:24`, the private `def deduplicated; freeze; end`).
- `SCOPED_SKIP_GROUPS[11]` (`scripts/parity/conventions.ts`) exempts `alias :-@ :deduplicate` across
  `deduplicable.rb`, `column.rb`, `sql_type_metadata.rb`, `mysql/type_metadata.rb`,
  `postgresql/type_metadata.rb`, claiming TS has no unary-minus method. trails already spells
  `Duration#-@` as `negate` through `OPERATOR_SPELLING_BY_FQN`, so the alias has a spelling.
- `parity:api:extra` reports **6 inlined bodies** from `deduplicable.rb`: `connection-adapters/column.ts`
  (2), `mysql/type-metadata.ts`, `postgresql/type-metadata.ts`, `sql-type-metadata.ts` (2) — module
  members written on the including classes instead of `connection-adapters/deduplicable.ts`.

## Acceptance criteria

- [ ] `deduplicated` has a real body in `deduplicable.ts`, and the including classes reach `deduplicate`/`deduplicated` through `include()` rather than re-declaring them.
- [ ] `-@` gets an `OPERATOR_SPELLING_BY_FQN` entry for `Deduplicable` and `SCOPED_SKIP_GROUPS[11]` is deleted.
- [ ] `pnpm parity:api:extra --package activerecord` lists no `inlined-from connection_adapters/deduplicable.rb` row.
- [ ] `deduplicable.rb` scores 100%; `pnpm parity:api:extra:gate` stays rowless.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
