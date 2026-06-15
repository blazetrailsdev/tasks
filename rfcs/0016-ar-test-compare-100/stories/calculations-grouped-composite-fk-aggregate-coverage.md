---
title: "Cover sum/average/min/max for grouped composite-key belongs_to association"
status: ready
updated: 2026-06-15
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`groupedCompositeAssoc`
(`packages/activerecord/src/relation/calculations.ts:498`) implements grouped
calculations keyed by a **composite-key** `belongs_to` association: it builds a
multi-column GROUP BY and keys the result Map by the loaded record (resolving the
target via its composite primary key, since JS Map keys compare by reference).

The current test coverage (`packages/activerecord/src/calculations.test.ts`, the
`it("should calculate grouped association with composite foreign key", ...)`
case near line 7461, with the `cpk_orders` / `cpk_books` schema defined in the
`beforeAll` at ~7413) only exercises **count**. The sum/average/min/max paths
through `groupedCompositeAssoc` + `buildAggNode` (`calculations.ts:210`) for a
composite-FK grouping are unverified — a latent coverage gap, not a known bug.

Rails covers these in `calculations_test.rb` (the Cpk::\* grouped-aggregate
cases). This story adds the missing aggregate coverage so a regression in the
composite-key GROUP BY for sum/avg/min/max is caught.

## Acceptance criteria

- [ ] Add tests mirroring the Rails `calculations_test.rb` composite-key grouped
      cases for `sum`, `average`, `minimum`, and `maximum` over a composite-FK
      `belongs_to` (alongside the existing `count` case). Mirror Rails test
      names verbatim; do not rename.
- [ ] Tests assert the result Map is keyed by the correct composite-PK target
      record (reuse the `byRecord` helper in the file) and that the aggregate
      value is correct.
- [ ] If any aggregate path is found broken (not just uncovered), fix
      `groupedCompositeAssoc` / `buildAggNode` rather than the test name.
- [ ] CI green on all three adapters; test:compare delta non-negative.
