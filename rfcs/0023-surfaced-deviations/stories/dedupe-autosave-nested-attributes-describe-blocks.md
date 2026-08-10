---
title: "Merge the duplicated TestDefaultAutosaveAssociationOnAHasManyAssociationWithAcceptsNestedAttributes describe blocks"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: autosave-association.test.ts now has exactly one TestDefaultAutosaveAssociationOnAHasManyAssociationWithAcceptsNestedAttributes describe (grep -c = 1 on main)."
---

## Context

`packages/activerecord/src/autosave-association.test.ts` declares
`describe("TestDefaultAutosaveAssociationOnAHasManyAssociationWithAcceptsNestedAttributes")`
**twice** — once at ~line 2542 and again at ~line 4539. Rails has a single
class of that name at
`vendor/rails/activerecord/test/cases/autosave_association_test.rb:580`.

Surfaced while converging the canonical Pirate/Bird shadows (PR #5220-series,
PR #5250): both blocks had byte-identical bespoke `makeModels()` factories, so
the same fix had to be applied twice. Both now return canonical
`Pirate`/`Bird`, and the second block's two tests
(`errors details should be set for invalid nested`,
`valid nested attributes create children`) are near-duplicates of the first
block's `errors details should be set` / `valid adding with nested attributes`.

A split describe also defeats `parity:test`, which matches our describe names
to Rails test classes — two blocks for one Rails class inflates the apparent
mapping.

## Acceptance criteria

- The two describe blocks are merged into one, in Rails' file order.
- Check each test in the second block against
  `autosave_association_test.rb:580-816` before merging: if a test duplicates
  one already in the first block and Rails has no such test, drop it; if Rails
  does have it, keep the Rails-verbatim name.
- No test names are renamed or reworded.
- `pnpm vitest run packages/activerecord/src/autosave-association.test.ts`
  stays green.
