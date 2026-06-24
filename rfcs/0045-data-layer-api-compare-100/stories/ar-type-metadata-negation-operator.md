---
title: "ar-type-metadata-negation-operator"
status: claimed
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-adapter
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-06-24T10:30:39Z"
assignee: "ar-type-metadata-negation-operator"
blocked-by: null
---

## Context

Five adapter type/column classes miss Ruby's unary-minus method `-@`, which
Rails defines for the deduplication protocol (`-@` returns a frozen/deduped
copy, used by `Deduplicable`):

- `connection-adapters/deduplicable.ts` (4/5): `-@` — the
  `Deduplicable#-@` definition
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/deduplicable.rb`).
- `connection-adapters/column.ts` (21/22): `-@`.
- `connection-adapters/sql-type-metadata.ts` (8/9): `-@`.
- `connection-adapters/mysql/type-metadata.ts` (4/5): `-@`.
- `connection-adapters/postgresql/type-metadata.ts` (5/6): `-@`.

These classes `include Deduplicable`; `-@` deduplicates the immutable value
object. TS has no `-@` operator and trails dedup (if any) is realized
differently. Single coherent concept across five files.

## Acceptance criteria

- `-@` resolved on Deduplicable and the four including classes — ported as a
  named dedup method if trails has a dedup pool, OR a single `SKIP_GROUPS` entry
  naming `-@` with the reason ("Ruby `-@` deduplication operator; TS has no
  unary-minus method and trails value objects are not interned").
- `pnpm api:compare --package activerecord` shows deduplicable.ts, column.ts,
  sql-type-metadata.ts, mysql/type-metadata.ts, postgresql/type-metadata.ts at
  100%.
