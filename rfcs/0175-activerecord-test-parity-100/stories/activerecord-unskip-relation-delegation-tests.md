---
title: "activerecord: relation/delegation_test.rb — 46 skipped matches and 160 TS-only tests"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: skipped-tests
packages: ["activerecord"]
deps:
  [
    "converge-delegated-classes-onto-rails-literal-list",
    "test-extractor-expands-hash-and-const-define-method-loops",
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation/delegation_test.rb → relation/delegation.test.ts` is the worst file in `parity:test`: **3 OK,
46 skipped, 160 extra**. Rails' file (`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb`) generates its cases by iterating
`ActiveRecord::Delegation.delegated_classes` / `QueryingMethodsDelegationTest::QUERYING_METHODS` and
`define_method`-ing one test per method; trails ports them as `it.skip` placeholders plus a hand-written
TS-only suite. `ruby-extractor-emits-mixin-tests-per-includer` and
`test-extractor-expands-hash-and-const-define-method-loops` (RFC 0025) are the extractor sides;
`converge-delegated-classes-onto-rails-literal-list` (RFC 0082) is the source side.

## Acceptance criteria

- [ ] The generated cases are ported with Rails' generated names (a `for … of` loop over the same constant list), none skipped.
- [ ] The 160 TS-only tests are deleted where they duplicate a Rails case, else moved to `delegation.trails.test.ts`.
- [ ] `relation/delegation_test.rb` 49/49 with 0 skipped and 0 extra.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
