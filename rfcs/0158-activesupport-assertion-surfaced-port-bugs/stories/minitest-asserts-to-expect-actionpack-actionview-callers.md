---
title: "minitest-asserts-to-expect-actionpack-actionview-callers"
status: draft
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
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
the actionpack-actionview package(s) (`grep -rl "testing/assertions" packages/actionpack`).

## Acceptance criteria

- Every call of a Minitest helper uses the built-in Vitest matcher of its
  CONTRIBUTING.md row (`toBeTruthy`, `toEqual`, `toBeCloseTo`,
  `toBeInstanceOf`, `toHaveLength(0)`, …).
- A `@blazetrails/vitest-matchers` matcher (`toBeRubyTruthy`, `toEqualRuby`,
  `toBeWithinDelta`, `toBeExactInstanceOf`, `toBeEmpty`, `toRespondTo`)
  replaces the built-in only at a call site where the built-in gives the wrong
  result for that value, by the table's "Use the Ruby matcher only when"
  column; a built-in that wrongly passes (`toBeFalsy` on `0`) counts. Where one
  is used, the package declares `@blazetrails/vitest-matchers` as a
  devDependency and its tsconfig references `../vitest-matchers`, so `tsc`
  sees the `declare module "vitest"` augmentation; the root `tsconfig.json`
  reference alone does not reach a package's compile graph.
- No ruby-compat call appears in a test to assert.
- `ActiveSupport::Testing::Assertions` members (`assertNot`, `assertRaises`,
  `assertDifference`, …) stay.
- `pnpm parity:test:assertions` stays green.
