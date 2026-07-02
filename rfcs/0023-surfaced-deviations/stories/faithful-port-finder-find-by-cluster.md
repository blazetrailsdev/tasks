---
title: "Faithfully port finder.test.ts find/find_by cluster onto real finder_test.rb models/fixtures"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up tranche of faithful-port-finder-test-synthetic-clusters (PR #4421).
The `find` / `find_by` cluster in packages/activerecord/src/finder.test.ts is
still thin ad-hoc coverage: many `it("find by ...")` / `it("find with ...")`
tests use inline `class Topic`/`class Post` stubs + weak `toBeDefined()`
assertions instead of faithful ports (e.g. "find by one attribute that is an
aggregate", "find on hash conditions with qualified attribute dot notation",
"find with a single composite primary key" — real Rails tests ride canonical
models like Customer/aggregations, Cpk::Book, Post/Comment).

Rails source: vendor/rails/activerecord/test/cases/finder_test.rb (grep
`def test_find`). Aggregate-attribute tests need the Customer composed_of
fixtures; composite-PK tests need the cpk models.

## Acceptance criteria

- [ ] Map each `find`/`find_by` test to its finder_test.rb counterpart; port
      onto the real canonical models/fixtures Rails uses (Customer aggregations,
      Cpk models, Post/Comment) matching column semantics.
- [ ] Drop synthetic tests with no Rails counterpart.
- [ ] Test names match Rails verbatim; require-canonical-schema stays clean.
