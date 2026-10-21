---
title: "delete-minitest-builtin-assert-helpers"
status: draft
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - minitest-asserts-to-expect-activesupport-callers
  - minitest-asserts-to-expect-trailties-callers
  - minitest-asserts-to-expect-actionpack-actionview-callers
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

Final step of `minitest-builtin-asserts-port-as-expect`. Once the per-package
caller stories land, nothing calls the Minitest built-ins ported into
`packages/activesupport/src/testing/assertions.ts` (moved surface: Ruby
defines them in `vendor/minitest/*/lib/minitest/assertions.rb:171-812`, not in
`activesupport/lib/active_support/testing/assertions.rb`).

Also lift the `kindOf: "instanceOf"` HISTOGRAM_FOLD in
`scripts/test-compare/assertion-kinds.ts` once the `toBeInstanceOf` ports of
`assert_instance_of` are converged to `toBeExactInstanceOf(cls)`, or
file that as its own story if it does not fit.

## Acceptance criteria

- `assert`, `assertEqual`, `assertNotEqual`, `assertNil`, `assertNotNil`,
  `assertSame`, `assertNotSame`, `assertInDelta`, `assertEmpty`,
  `assertNotEmpty`, `assertIncludes`, `assertNotIncludes`, `assertMatch`,
  `assertNoMatch`, `assertInstanceOf`, `assertKindOf`, `assertNotKindOf`,
  `assertPredicate`, `assertNotPredicate`, `assertRespondTo`,
  `assertNotRespondTo`, `assertOperator`, `diff` and `message` are deleted from
  `testing/assertions.ts` and the activesupport index re-exports.
- `ActiveSupport::Testing::Assertions` members stay; `Assertion`, `Skip`,
  `UnexpectedError`, `Test`, `BacktraceFilter`, `Minitest` stay.
- `pnpm parity:api:extra:gate` green; activesupport mark lowered with
  `pnpm parity:api:extra:tighten`. `pnpm parity:test:assertions` green.
