---
title: "lint-js-semantics-matchers-in-ported-tests"
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

`minitest-builtin-asserts-port-as-expect` (trails#9176) ports Minitest's built-in
assertions as Vitest matchers from the new `@blazetrails/vitest-matchers`
package. `assert x` becomes `expect(x).toBeRubyTruthy()`, `refute x` becomes
`.toBeRubyFalsy()`, and `assert_in_delta exp, act, d` becomes
`expect(act).toBeWithinDelta(exp, d)`. The built-in matchers they replace
check something different:

- `toBeTruthy` / `toBeFalsy` use JS truthiness. `0`, `""` and `NaN` are
  falsy in JS, but truthy in Ruby (`vendor/minitest/*/lib/minitest/assertions.rb:171`,
  `:650`).
- `toBeCloseTo(exp, digits)` takes a number of decimal digits, not a delta
  (`assertions.rb:241`).

When a Rails-ported test uses one of these, it can pass where Rails' assertion
would fail, and the assertion comparer still credits it, because
`TRAILS_MAP` in `scripts/test-compare/assertion-kinds.ts` maps `toBeTruthy` to
`truthy` and `toBeCloseTo` to `inDelta`. Distinct matcher names make a
name-based lint enough to catch this.

Current usage in `*.test.ts` files other than `*.trails.test.ts`:

| Matcher       | Calls | Files |
| ------------- | ----- | ----- |
| `toBeTruthy`  | 2,511 | 298   |
| `toBeFalsy`   | 1,309 | 173   |
| `toBeCloseTo` | 45    | 8     |

That is too many to convert in one PR, so the lint has to ratchet.

## Acceptance criteria

- An ESLint rule, `eslint/no-js-semantics-matchers.mjs` plus its test, reports
  `.toBeTruthy()`, `.toBeFalsy()` and `.toBeCloseTo()`, including under
  `.not`. It applies to Rails-ported test files: `**/*.test.ts` in
  `packages/*/src`, excluding `*.trails.test.ts`, which are TS-only tests where
  JS truthiness is the intended semantics.
  - The message names the replacement: `toBeRubyTruthy()`, `toBeRubyFalsy()`,
    or `toBeWithinDelta(exp, delta)`. If the value is known to be a boolean,
    the replacement is `toBe(true)` / `toBe(false)`.
- The rule ratchets: only-shrink per file against the count at the merge-base
  with `origin/main`, the same way `pnpm parity:api:sends` works, with no mark
  file. A file whose count is 0 cannot add one.
- After the rule lands, `TRAILS_MAP` stops crediting `toBeCloseTo` as `inDelta`.
  Only `toBeWithinDelta` credits `inDelta`.
- The `minitest-asserts-to-expect-*-callers` stories convert to zero the files
  they touch, so the ratchet tightens as those stories land.
- `CONTRIBUTING.md` § "Porting a Minitest assertion" names the rule.
