---
title: "activesupport-assert-not-returns-void-where-rails-returns-true"
status: done
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#7998
claim: "2026-09-23T14:33:22Z"
assignee: "activemodel-respond-to-cannot-hide-private-methods"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::Assertions#assert_not`
(`vendor/rails/activesupport/lib/active_support/testing/assertions.rb:20-23`)
ends in `assert !object, message`, and Minitest's `assert` returns `true`, so
`assert_not(nil)` evaluates to `true`. `test_case_test.rb:20-28` asserts exactly
that:

```ruby
assert_equal true, assert_not(nil)
assert_equal true, assert_not(false)
```

trails' `assertNot` (`packages/activesupport/src/testing/assertions.ts:114-117`)
returns `void`, as does `assert` (`:341-345`), so both reads answer `undefined`.

## Parked test

`packages/activesupport/src/test-case.test.ts` › `assert not`, `it.skip` with
the converged body and a `BLOCKED:
activesupport-assert-not-returns-void-where-rails-returns-true` line. The same
test also asserts the two failure messages, which land under
[[activesupport-assertion-failure-messages-diverge-from-minitest]].

## Acceptance criteria

- [ ] `assert` returns `true` and `assertNot` returns its result, mirroring
      Minitest.
- [ ] `assert not` runs unskipped and green with its converged body unchanged.
