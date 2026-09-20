---
title: "has-many-associations-test-rails-member-order"
status: draft
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` does not follow the
member order of
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.
Its 24 `describe` blocks open, in file order, at these Rails lines:

```text
62, 1576, 51, 1966, 1903, 639, 1563, 3036, 2880, 1003,
129, 1132, 2822, 601, 84, 312, 3262, 1480, 1331, ?, 1294, 1422, 1405, 1021
```

Individual blocks are not ordered internally either — the `companies, accounts` block
(currently at :176) runs 1576, 1590, 1095, 1107, 1041, 1051, 1802, 1815, 1828, 1841.

The driver is that trails declares `fixtures([...])` per `describe` where Rails declares it
once for the class (rb:118-123), so the file is partitioned by fixture set rather than by
Rails position. Raised in review on trails#7902, where the fix was out of scope: a re-sort
touches all ~6,200 lines across 24 fixture-partitioned blocks, well past the 700 LOC
ceiling.

Note `parity:test` reports `Move 0` for this file today, so nothing currently measures
this — it is a fidelity gap, not a red gate.

## Acceptance criteria

- Tests appear in Rails line order within each `describe`, and the blocks themselves are
  ordered by the Rails line of their first test.
- Where two adjacent Rails tests are split across blocks only by fixture set, they are
  merged into one block whose `fixtures([...])` is the union, rather than left apart.
- `pnpm parity:test -- --package activerecord --assertions | grep has_many_associations_test`
  counters do not regress.
