---
title: "minitest-asserts-to-expect-activesupport-callers"
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
the activesupport package(s) (`grep -rl "testing/assertions" packages/activesupport`).

## Acceptance criteria

- Every call of a Minitest helper uses its form from the CONTRIBUTING.md
  table: `toBeRubyTruthy` / `toBeRubyFalsy` for `assert` / `refute` and
  `assert_predicate` (`expect(o.isFoo()).toBeRubyTruthy()`), `toEqual` for
  `assert_equal` (the registered equality tester applies Ruby `==`),
  `toBeWithinDelta`, `toBeEmpty`, `toBeExactInstanceOf` for
  `assert_instance_of`, `toBeInstanceOf` for `assert_kind_of`, `toRespondTo`,
  and the built-ins `toBeNull`, `toBe`, `toContainEqual` / `toContain`,
  `toMatch`. No `toBeTruthy` / `toBeFalsy` / `toBeCloseTo`, and no ruby-compat
  call in a test to assert.
- The package's test tsconfig sees the `@blazetrails/vitest-matchers` type
  augmentation (a dependency plus a project reference), so the matchers
  type-check.
- `ActiveSupport::Testing::Assertions` members (`assertNot`, `assertRaises`,
  `assertDifference`, …) stay.
- `pnpm parity:test:assertions` stays green.
