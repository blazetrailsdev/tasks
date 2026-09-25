---
title: "assert_difference/assert_changes failure messages render object.num where Rails renders @object.num"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

When the RFC 0132 assertion-mark freeze was lifted (2026-09-24), activesupport's
`assertion-value-mismatch` counter read 10, where the 2026-09-23 re-verification
in `flip-assertion-mismatch-gate-to-hard-zero`'s blocker read 0. All 10 are in
`vendor/rails/activesupport/test/test_case_test.rb`, ported at
`packages/activesupport/src/test-case.test.ts`, and none is in that story's
residue list:

- assert no difference fail
- assert no difference with message fail
- hash of expressions with message
- assert difference message includes change
- assert difference message with lambda
- assert changes with to option but no change has special message
- assert changes message with lambda
- assert changes with message
- assert no changes with message
- assert no changes message with lambda

Every one differs only in the expression rendered into the failure message.
Rails' tests read an instance variable, `assert_difference "@object.num"` or
`-> { @object.num }` (`test_case_test.rb:51-58,173-181`), and
`assert_difference` renders it verbatim: `code_string = code.respond_to?(:call) ?
_callable_to_source_string(code) : code`
(`activesupport/lib/active_support/testing/assertions.rb:122`). So the expected
message reads `` `@object.num` ``. The trails test closes over a local, so
`() => object.num` renders as `` `object.num` ``
(`test-case.test.ts:85-98,268-280`). The messages have used `object.num` since
trails#7916. The counter is newly measured, not a new regression: the helper
receipts in trails#8066 made these `assertRaises` bodies comparable.

## Acceptance criteria

- The ten tests assert Rails' message strings verbatim. Either the test state
  moves onto a receiver whose source spelling renders as Rails' `@object`, or
  the comparer is shown to be wrong about the value, with the Ruby `file:line`.
- `pnpm parity:test:assertions` reads activesupport `assertion-value-mismatch`
  0, and the mark is lowered with `pnpm parity:test:assertions:reseed`.
