---
title: "Port ARRAY_DELEGATES test_delegates_*_to_Array loop under Rails names"
status: in-progress
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8153
claim: "2026-09-26T17:22:02Z"
assignee: "port-resolver-caching-and-cache-template-loading"
blocked-by: null
closed-reason: null
---

## Context

PR #8127 taught `scripts/test-compare/extract-ruby-tests.rb` to expand operator-symbol
elements, so `ActiveRecord::DelegationTests::ARRAY_DELEGATES.each { define_method "test_delegates_#{method}_to_Array" }`
(`vendor/rails/activerecord/test/cases/relation/delegation_test.rb:10-24`) now
generates its 45 tests. It includes them into `DelegationAssociationTest`,
`DelegationRelationTest` and `DelegationRecordsTest` (`:31-53`).

The trails port (`packages/activerecord/src/relation/delegation.test.ts:266-285`,
`:307-312`) loops over a trails-invented `DELEGATED_ARRAY_METHODS` list, titled
`` `test_delegates_${method}_to_Array` `` with camelCase JS names. Those titles do
not normalize to Rails' `delegates <ruby_name> to Array`, so `parity:test` lists
all 45 as missing plus the loop as extra. Only "delegates partition to Array"
matches today.

## Converged shape

Port `ARRAY_DELEGATES` verbatim as a Ruby-named list, and give each tested
class (`DelegationAssociationTest`, `DelegationRelationTest`, and the missing
`DelegationRecordsTest` with `Comment.all().records`) a loop titled
`` `delegates ${method} to Array` `` whose body is Rails' single
`assert_respond_to target, method` (`assertRespondTo`, which answers the Ruby
name through `rbObjRespondTo`). Keep the trails-only loading checks in
`delegation.trails.test.ts`.

## Acceptance criteria

- `pnpm parity:test --package activerecord` reports `relation/delegation_test.rb`
  with 0 missing among the `delegates * to Array` family.
- No assertion-mark rise for activerecord.
