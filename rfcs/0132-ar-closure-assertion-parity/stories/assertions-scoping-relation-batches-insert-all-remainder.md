---
title: "assertions-scoping-relation-batches-insert-all-remainder"
status: in-progress
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7896
claim: "2026-09-19T22:24:33Z"
assignee: "assertions-scoping-relation-batches-insert-all-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-scoping-relation-batches-insert-all (RFC 0132). The first PR converged the
mechanical batches_test.rb kinds (`assert_kind_of Array` -> `toBeInstanceOf(Array)`,
`assert_nothing_raised` -> `resolves.not.toThrow()`, dropped an extra notNil) in
`packages/activerecord/src/batches.test.ts`. Rails: `vendor/rails/activerecord/test/cases/batches_test.rb`.

Remaining (re-measure with `pnpm parity:test -- --package activerecord --assertions --missing`):
batches_test.rb (in_batches loaded/enumerator/custom-column tests: operator/truthy/falsy/raises kinds),
insert_all_test.rb, relation_test.rb, scoping/named_scoping_test.rb, scoping/relation_scoping_test.rb,
scoping/default_scoping_test.rb (none started). Note `assert_queries_count`/`assert_no_queries` are unmapped
on both sides; the mismatches there are the surrounding assert_kind_of/assert_equal kinds.

## Acceptance criteria

- Each listed file reports 0 assertion mismatches; no test renames; mark file frozen (do not reseed).
