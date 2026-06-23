---
title: "remove-cold-cache-insert-reflection-fallback"
status: in-progress
updated: 2026-06-23
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: 4015
claim: "2026-06-23T15:45:23Z"
assignee: "remove-cold-cache-insert-reflection-fallback"
blocked-by: null
---

## Context

Added in PR #3835 (story `persistence-non-pk-autoincrement-writeback`).
`Base#_performInsert` (`packages/activerecord/src/base.ts`) identifies the
auto-increment column for INSERT write-back from reflected columns. On a COLD
schema cache the sync `columns()` returns synthesized shapes (derived from
`_attributeDefinitions`, no `isAutoIncrementedByDb`), so the code falls back to a
per-insert READ-ONLY `connection.columns(tableName)` reflection query to recover
the auto-increment column and the real column-name set.

That read-only-reflection branch is a workaround for the schema cache not always
being warm. Once RFC 0031 guarantees an eagerly-warmed persistent schema cache,
`columns()` will always return real Column objects and the fallback branch (plus
its extra DB round-trip per cold insert) is dead code.

## Acceptance criteria

- [ ] Once the schema cache is always warm, remove the cold-cache
      `connection.columns(tableName)` read-only reflection branch in
      `Base#_performInsert` (the `autoIncColumn === undefined && !insertCols.some(...)`
      guard) and the `colNames.clear()` rebuild it performs.
- [ ] Auto-increment write-back (incl. non-PK auto-increment `id` —
      `TitlePrimaryKeyTopic`, and AutoId's non-first auto-populated column) still
      resolves from the sync `columns()` on sqlite/postgres/mysql.
- [ ] No extra per-insert schema query remains.
- [ ] `pnpm lint` + typecheck clean.
