---
title: "duration-has-no-zero-predicate"
status: done
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7903
claim: "2026-09-20T12:37:37Z"
assignee: "duration-has-no-zero-predicate"
blocked-by: null
closed-reason: null
---

## Context

Converging `core_ext/duration_test.rb`'s `test_respond_to` under RFC 0132 found
that `Duration` has no `zero?` predicate.

Rails asserts both members respond
(`vendor/rails/activesupport/test/core_ext/duration_test.rb:368-371`):

```ruby
assert_respond_to 1.day, :since
assert_respond_to 1.day, :zero?
```

`Duration#zero?` is defined at
`vendor/rails/activesupport/lib/active_support/duration.rb` alongside the other
`value`-delegating predicates. `packages/activesupport/src/duration.ts` has
`since` but nothing spelled `isZero` (the trails spelling for a Ruby `?`
predicate), so `rbObjRespondTo(Duration.day(1), "isZero")` is false.

`packages/activesupport/src/core-ext/duration.test.ts`'s `respond to` is parked
`it.skip` with the converged body (two `assert_respond_to` rows spelled through a
local `assertRespondTo` helper) and a `BLOCKED:` line pointing here.

## Acceptance criteria

- [ ] `Duration#isZero` exists, ported from Rails' `zero?`.
- [ ] The parked `respond to` test is un-skipped and green with its converged
      body unchanged.
