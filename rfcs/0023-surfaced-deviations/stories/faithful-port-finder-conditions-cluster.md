---
title: "Faithfully port finder.test.ts conditions/include/member cluster onto real finder_test.rb models/fixtures"
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
The conditions cluster in packages/activerecord/src/finder.test.ts — hash/array
conditions, ranges, bind variables, `include?`/`member?` on relations, and the
UTC/local time-interpolation tests — is still thin ad-hoc coverage on inline
`class Post`/`class Topic` stubs. Several ("condition utc time interpolation
with default timezone local", "find on hash conditions with array of integers
and ranges" [already faithful via Range], "hash condition find with aggregate
having ... mappings") approximate real Rails tests over canonical
Topic/Comment/Customer fixtures.

Rails source: vendor/rails/activerecord/test/cases/finder_test.rb (grep
`def test_condition`, `def test_hash_condition`, `def test_bind`,
`def test_include`, `def test_member`).

## Acceptance criteria

- [ ] Map each conditions/include/member/time-interpolation test to its
      finder_test.rb counterpart; port onto canonical models + real fixtures.
- [ ] Drop synthetic tests with no Rails counterpart.
- [ ] Test names match Rails verbatim; require-canonical-schema stays clean.
