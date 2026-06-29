---
title: "belongs_to: out-of-range FK value should return nil, not raise RangeError"
status: in-progress
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4267
claim: "2026-06-29T12:34:10Z"
assignee: "belongs-to-out-of-range-fk-returns-nil"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb:1540` — `test_belongs_to_with_out_of_range_value_assigning`: when an FK attribute is set to a value outside DB bigint range, Rails silently returns `nil` from `author.author_address` (the FK lookup catches the range error). In trails, `loadBelongsTo("authorAddress")` propagates the PG `RangeError` to the caller and also aborts the transaction, poisoning subsequent tests. Surfaced in PR #4209 (test marked `.todo`).

Trails source: `packages/activerecord/src/associations/belongs-to-association.ts` — `loadTarget()` calls `find()` which propagates the DB exception instead of returning nil.

## Acceptance criteria

- `loadBelongsTo` (and the sync getter) return `null` when the FK value is outside the DB column's range, instead of propagating a `RangeError`.
- The test `belongs to with out of range value assigning` in `belongs-to-associations.test.ts` passes (un-todo).
