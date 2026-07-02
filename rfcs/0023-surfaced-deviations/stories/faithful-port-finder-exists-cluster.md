---
title: "Faithfully port finder.test.ts exists cluster onto real finder_test.rb models/fixtures"
status: in-progress
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 4426
claim: "2026-07-02T17:45:51Z"
assignee: "faithful-port-finder-exists-cluster"
blocked-by: null
closed-reason: null
---

## Context

Follow-up tranche of faithful-port-finder-test-synthetic-clusters (PR #4421,
which faithfully ported only the ordinal/last cluster). The `exists` cluster in
packages/activerecord/src/finder.test.ts (block 2 + the makeModel Post block)
is still thin ad-hoc coverage: dozens of `it("exists with ...")` tests using
inline `class Topic`/`class Post extends Base` stubs that create a row and
assert `exists()` truthy, rather than faithful ports of the real
`test_exists*` tests.

Rails source: vendor/rails/activerecord/test/cases/finder_test.rb (grep
`def test_exists`). Many synthetic names ("exists with left joins", "exists
with eager load", "exists should reference correct aliases while joining tables
of has many through association", etc.) approximate real Rails tests that
exercise joins/includes/aggregates against canonical Post/Comment/Author
fixtures — port them onto real models + fixtures or drop those with no
counterpart.

## Acceptance criteria

- [ ] Map each `exists*` test to its finder_test.rb counterpart; port onto
      canonical models + real fixtures matching Rails semantics.
- [ ] Drop synthetic `exists*` tests with no Rails counterpart.
- [ ] Test names match Rails verbatim; require-canonical-schema stays clean.
