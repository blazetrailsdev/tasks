---
title: "activerecord: QueryingMethodsDelegationTest holds a literal list where Rails derives it from public_instance_methods"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:58-72`
builds `QueryingMethodsDelegationTest::QUERYING_METHODS` by reflection:

- `ActiveRecord::Batches.public_instance_methods(false)`
- plus `ActiveRecord::Calculations.public_instance_methods(false)`
- plus `ActiveRecord::FinderMethods.public_instance_methods(false)` minus
  `include?`, `member?`, `raise_record_not_found_exception!`
- plus `ActiveRecord::SpawnMethods.public_instance_methods(false)` minus
  `spawn`, `merge!`
- plus `ActiveRecord::QueryMethods.public_instance_methods(false)` rejecting
  names ending in `=`, `!`, `?`, `value`, `values`, `clause`, minus `all`,
  `reverse_order`, `arel`, `extensions`, `construct_join_dependency`
- plus the literal tail at `:66-71`.

Line 79 then asserts that list equals `ActiveRecord::Querying::QUERYING_METHODS`
(`activerecord/lib/active_record/querying.rb:5`). The point of the test is that
a public method added to one of the five modules fails it until the constant is
updated.

trails' port (`packages/activerecord/src/relation/delegation.test.ts`,
`describe("QueryingMethodsDelegationTest")`) holds a hand-written literal of
about 115 names instead, so the assertion compares two literals and cannot
catch a module gaining a method. The derivation is not expressible today:
ruby-compat's `publicInstanceMethods` (`packages/ruby-compat/src/include.ts`)
reads the section record `defineModule` stamps, and only `SpawnMethods`
(`relation/spawn-methods.ts`) and `QueryMethods` (`relation/query-methods.ts`)
are `defineModule`d. `Batches` (`relation/batches.ts`), `Calculations`
(`relation/calculations.ts`, a plain object at `:644`) and `FinderMethods`
(`relation/finder-methods.ts`, a plain object at `:391`) are not.

## Acceptance criteria

- [ ] `Batches`, `Calculations` and `FinderMethods` are `defineModule`d with
      their Rails public/private sections, so `publicInstanceMethods(Mod, false)`
      answers Rails' list for each.
- [ ] The test's `QUERYING_METHODS` is derived as `delegation_test.rb:58-72`
      derives it: the five `publicInstanceMethods(…, false)` reads, the same
      subtractions and suffix rejection (in their trails spellings), and the
      literal tail.
- [ ] The equality assertion against `Querying.QUERYING_METHODS` still passes,
      and fails when a public method is added to one of the five modules
      without updating the constant.

## Verification

```bash
pnpm vitest run packages/activerecord/src/relation/delegation.test.ts
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
