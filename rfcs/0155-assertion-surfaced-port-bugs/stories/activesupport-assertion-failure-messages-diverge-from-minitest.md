---
title: "activesupport-assertion-failure-messages-diverge-from-minitest"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

RFC 0132 converged `test_case_test.rb`'s assertions
(`packages/activesupport/src/test-case.test.ts`). Fourteen tests assert the
EXACT failure message Minitest produces, and trails' `assert`
(`packages/activesupport/src/testing/assertions.ts:341-345`) raises the rich
message alone — it never appends Minitest's equality diff.

Rails' `assert_no_difference` failure message
(`vendor/rails/activesupport/test/test_case_test.rb:50-57`) is

```text
`@object.num` didn't change by 0, but by 1.
Expected: 0
  Actual: 1
```

trails produces only the first line. Same gap for `assert_changes` /
`assert_no_changes` (`test_case_test.rb:226-230,237-246,585-588`), and
`assert_raises(match:)`'s mismatch message, which Rails spells
`Expected /incorrect/i to match "Wrong argument".`
(`test_case_test.rb:36-41`) where `assertMatch`
(`assertions.ts:509-512`) spells `Expected "Wrong argument" to match /incorrect/i`.

Three further tests in the family assert `#<Proc:0x...`/`#<Object:0x...`
inspect output for a non-source-derivable callable
(`test_case_test.rb:405-407,432-434,455-458,470-481`), which
`_callableToSourceString` (`assertions.ts:322-336`) has no counterpart for.

## Parked tests

All in `packages/activesupport/src/test-case.test.ts`, `it.skip` with the
converged body intact and a `BLOCKED:
activesupport-assertion-failure-messages-diverge-from-minitest` line:

- `assert raises with match fail`
- `assert no difference fail`
- `assert no difference with message fail`
- `hash of expressions with message`
- `assert difference message includes change`
- `assert difference message with lambda`
- `assert changes with to option but no change has special message`
- `assert changes message with lambda`
- `assert changes with message`
- `assert no changes with message`
- `assert no changes message with lambda`
- `assert no changes message with multi line lambda`
- `assert no changes message with not real callable`
- `assert no changes with long string wont output everything`

## Acceptance criteria

- [ ] `assert` (or the per-assertion rich messages) appends the Minitest
      `Expected:` / `Actual:` diff the way `assert_equal` does, and
      `assertMatch` spells its message Rails' way round.
- [ ] Every parked test above runs unskipped and green with its converged body
      unchanged.
