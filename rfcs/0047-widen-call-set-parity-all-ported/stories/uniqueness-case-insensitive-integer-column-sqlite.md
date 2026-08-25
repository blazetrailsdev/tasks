---
title: "uniqueness-case-insensitive-integer-column-sqlite"
status: done
updated: 2026-07-05
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4616
claim: "2026-07-05T15:07:28Z"
assignee: "uniqueness-case-insensitive-integer-column-sqlite"
blocked-by: null
---

## Context

`UniquenessValidator#build_relation` (trails `buildRelation` in
`packages/activerecord/src/validations/uniqueness.ts`) routes a
`case_sensitive: false` comparison through `adapter.caseInsensitiveComparison`,
which for the SQLite3 adapter emits `LOWER(col) = LOWER(?)`
(abstract-adapter.ts:1848, mirroring Rails'
`abstract_adapter.rb:814 case_insensitive_comparison`). When the column is an
**integer** (e.g. `validates_uniqueness_of :title, :parent_id, case_sensitive: false`,
Rails `uniqueness_validation_test.rb` `test_validate_case_insensitive_uniqueness`,
vendored at `vendor/rails/.../validations/uniqueness_validation_test.rb:296`),
the bound integer parameter does NOT match an existing row under SQLite:

```sql
-- existing row: topics.parent_id = 1 (integer)
SELECT COUNT(*) FROM topics WHERE LOWER(parent_id) = LOWER(?)  -- bind [1]  => 0
SELECT COUNT(*) FROM topics WHERE LOWER(parent_id) = LOWER(?)  -- bind ['1'] => 1
```

So the integer scope/attribute collision is silently missed on SQLite. This was
surfaced (not introduced) by the multi-attribute port in PR #4301
(validates-associated-uniqueness-merge-attributes); that PR's multi-attr
uniqueness test deliberately uses two **string** columns and leaves the
`parent_id` integer case-insensitive assertion from the Rails test unported.

## Acceptance criteria

- Determine whether Rails detects the integer `parent_id` collision under
  `case_sensitive: false` on sqlite3 (run/trace the Rails test), then converge
  trails to match — likely by mirroring Rails'
  `can_perform_case_insensitive_comparison_for?` so non-string columns fall back
  to `attribute.eq(value)` (plain equality) instead of `LOWER(col) = LOWER(?)`,
  OR by fixing the integer bind so `LOWER(?)` matches.
- Port the full Rails `test_validate_case_insensitive_uniqueness` (multi-attr
  `:title, :parent_id`) including the `parent_id` and nil-allowed assertions.

## Out of scope

- The `_merge_attributes` delegation itself (done in PR #4301).
