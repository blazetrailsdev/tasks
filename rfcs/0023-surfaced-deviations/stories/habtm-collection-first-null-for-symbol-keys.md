---
title: "HABTM collection proxy first() returns null for symbol/custom-key associations despite non-empty collection"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-07-03T01:21:52Z"
assignee: "habtm-collection-first-null-for-symbol-keys"
blocked-by: null
---

## Context

Surfaced while porting `has-and-belongs-to-many-associations.test.ts`
(`test_symbols_as_keys`, RFC 0048). With the inline `ProjectWithSymbolsForKeys` /
`DeveloperWithSymbolsForKeys` HABTM models (default `id` PK, symbol/string
`foreign_key`/`association_foreign_key`), after `project.developers << developer`
and `project.save!`:

- `project.developers.size()` returns 1 and `project.developers.toArray()[0]`
  returns the developer (correct), but
- `project.developers.first()` returns `null` (the port had to use
  `toArray()[0]` to assert `project.developers.first == developer`).

Rails' `test_symbols_as_keys` asserts `project.developers.first == developer`
directly, so `.first()` returning null while the collection is non-empty is a
correctness gap in the HABTM collection-proxy `first()` path for these
symbol/custom-key associations (likely an ordering/where-key resolution
difference between the `first()` LIMIT-1 requery and the full load).

## Acceptance criteria

- [ ] `first()` on a HABTM collection proxy returns the first record (matching
      `toArray()[0]`) for models with symbol/string foreign_key /
      association_foreign_key, mirroring Rails.
- [ ] Restore `project.developers.first()` (drop the `toArray()[0]` workaround)
      in `test_symbols_as_keys` and it passes on SQLite/PostgreSQL/MySQL.
