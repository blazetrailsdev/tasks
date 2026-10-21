---
title: "minitest-asserts-to-expect-trailties-callers"
status: draft
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Follow-up of `minitest-builtin-asserts-port-as-expect`. CONTRIBUTING.md
§ "Porting a Minitest assertion" maps each Minitest built-in
(`vendor/minitest/*/lib/minitest/assertions.rb:171-812`) to a Vitest
`expect` form, and `scripts/test-compare/assertion-kinds.ts` credits those
forms. The helpers in `packages/activesupport/src/testing/assertions.ts`
(`assert`, `assertEqual`, `assertNil`, `assertMatch`, `assertPredicate`,
`assertEmpty`, `assertIncludes`, … and their negations) still have callers in
the trailties package(s) (`grep -rl "testing/assertions" packages/trailties`).

## Acceptance criteria

- Every call of a Minitest helper in trailties uses its `expect` form from the
  CONTRIBUTING.md table (Ruby truthiness for `assert`, `rbEqual` for values
  with a Ruby `==`, `Math.abs` for `assert_in_delta`).
- `ActiveSupport::Testing::Assertions` members (`assertNot`, `assertRaises`,
  `assertDifference`, …) stay.
- `pnpm parity:test:assertions` stays green.
