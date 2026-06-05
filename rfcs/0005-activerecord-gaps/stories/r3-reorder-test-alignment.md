---
title: "R3 — align the 3 reorder-replaces-existing-order tests to Rails"
status: in-progress
updated: 2026-06-05
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 20
priority: 15
pr: 2952
claim: "2026-06-05T15:29:41Z"
assignee: "r3-reorder-test-alignment"
blocked-by: null
---

## Context

Three trails tests named `"reorder replaces existing order"` predate the March
2026 test-placement sweep and have no Rails mapping comment:

- `relations.test.ts:230` — integration test, `Post.order("title").reorder({ views: "asc" })`
- `relations.test.ts:2060` — integration test, `Widget.order({ name: "asc" }).reorder({ name: "desc" })`
- `relations.test.ts:4043` — SQL-only, `Product.order("name").reorder({ price: "desc" }).toSql()`

The Rails counterparts are in
`vendor/rails/activerecord/test/cases/relations_test.rb`:

- `test_finding_with_reorder` (line 429) — chains two `.order()` then `reorder("id")`, asserts result order
- `test_reorder_deduplication` (line 435) — `reorder("id desc", "id desc")`, asserts `order_values == ["id desc"]`

Named-aligned stubs already exist at `relations.test.ts:4914` ("finding with
reorder") and `relations.test.ts:4925` ("reorder deduplication") from the same
sweep, so `test:compare` already matches those Rails tests. The three old tests
remain unresolved.

Remaining work: for each of the three old tests, either (a) add a `// Rails:
test_finding_with_reorder` comment and confirm it exercises the same scenario, or
(b) remove it if it duplicates an aligned stub. Concretely: `:4043` is a
SQL-only near-duplicate of the aligned `:4914` stub — remove it; `:230` and
`:2060` are integration-level variants worth keeping — annotate them. The
aligned stub at `:4925` checks only `toContain("ORDER BY")` and does not verify
deduplication; strengthen it to assert `ORDER BY title` appears exactly once, or
document that `order_values` inspection is Rails-internal and skip.

## Acceptance criteria

- [ ] `relations.test.ts:4043` removed (duplicate SQL stub — covered by `:4914`)
- [ ] `relations.test.ts:230` and `:2060` annotated `// trails integration variant of test_finding_with_reorder`
- [ ] Aligned stub at `:4925` ("reorder deduplication") either strengthened to assert dedup in SQL or noted as a stub with the Rails-internal gap documented

## Notes

From the relation gap plan (R3), ready now.
