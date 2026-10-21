---
title: "minitest-builtin-asserts-port-as-expect"
status: in-progress
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9176
claim: "2026-10-21T15:17:42Z"
assignee: "minitest-builtin-asserts-port-as-expect"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/testing/assertions.ts` exports two kinds of assertion:

- **`ActiveSupport::Testing::Assertions`** (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb:21-301`):
  `assertNot`, `assertRaises`, `assertNothingRaised`, `assertDifference`,
  `assertNoDifference`, `assertChanges`, `assertNoChanges`. These are Rails API
  with their own Rails tests (`activesupport/test/test_case_test.rb`). **They stay.**
- **`Minitest::Assertions`** (`vendor/minitest/*/lib/minitest/assertions.rb:171-812`),
  ported into the activesupport file: `assert`, `assertEqual`,
  `assertNotEqual`, `assertNil`, `assertNotNil`, `assertSame`, `assertNotSame`,
  `assertInDelta`, `assertEmpty`, `assertNotEmpty`, `assertIncludes`,
  `assertNotIncludes`, `assertMatch`, `assertNoMatch`, `assertInstanceOf`,
  `assertKindOf`, `assertNotKindOf`, `assertPredicate`, `assertNotPredicate`,
  `assertRespondTo`, `assertNotRespondTo`, `assertOperator`, plus their
  support (`diff`, `message`). These are moved surface: Ruby defines them in a
  file the activesupport file does not mirror.

The decision is that a minitest built-in assertion ports as a Vitest `expect`,
the form about 2,300 test files already use, and the minitest helpers are
deleted rather than moved into a new package. 112 files import
`testing/assertions` today (90 activesupport tests, 7 trailties tests, plus
`test-case.ts`, the cache behaviors under `activesupport/src/cache/behaviors/`,
`actionpack/src/action-controller/test-case.ts`,
`actionpack/src/action-dispatch/testing/assertions.ts` and
`actionview/src/test-case.ts`). Usage of the helpers being removed:
`assertEqual` 103 files, `assert` 42, `assertMatch` 37, `assertPredicate` 22,
`assertEmpty` 14, `assertNoMatch` 12, `assertNil` 9, `assertIncludes` 8, and
fewer than 6 each for the rest.

Out of scope: `Assertion`, `Skip`, `UnexpectedError`, `Test`,
`BacktraceFilter`, and the `Minitest` object, which serve `TestCase` and
`after-teardown`. Those are a separate decision.

## Mapping table

Each Minitest call maps to one form. In Minitest, `exp` is the first argument;
in `expect`, the actual value goes in `expect(...)`, so the order flips. A
`msg` argument becomes `expect(x, msg)`. The `refute_*` and `assert_not_*`
forms map to `.not`, except where a row says otherwise.

| Minitest (`assertions.rb`)                     | `expect` form                                                                                                                       | Why it is not the obvious matcher                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `assert x` (`:171`)                            | `expect(x != null && x !== false).toBe(true)`                                                                                       | `toBeTruthy` fails on `0`, `""` and `NaN`, all truthy in Ruby. Use `expect(x).toBe(true)` when `x` is a boolean.       |
| `refute x` (`:650`)                            | `expect(x == null \|\| x === false).toBe(true)`                                                                                     | `toBeFalsy` passes on `0` and `""`.                                                                                    |
| `assert_equal exp, act` (`:220`)               | `expect(act).toEqual(exp)`                                                                                                          | For values with a Ruby `==` (records, `Duration`, `BigDecimal`, `Hash`), write `expect(rbEqual(act, exp)).toBe(true)`. |
| `refute_equal exp, act` (`:669`)               | `expect(act).not.toEqual(exp)`                                                                                                      | The same `rbEqual` caveat applies.                                                                                     |
| `assert_nil x` (`:305`)                        | `expect(x).toBeNull()`                                                                                                              | Ruby `nil` is `null`. An `undefined` failing here is a port bug, so fix the port, not the matcher.                     |
| `refute_nil x` (`:739`)                        | `expect(x).not.toBeNull()`, plus `.not.toBeUndefined()` if needed                                                                   | `x != null`.                                                                                                           |
| `assert_same exp, act` (`:463`)                | `expect(act).toBe(exp)`                                                                                                             | `Object.is` matches `equal?`.                                                                                          |
| `assert_in_delta exp, act, d = 0.001` (`:241`) | `expect(Math.abs(exp - act)).toBeLessThanOrEqual(d)`                                                                                | `toBeCloseTo` takes decimal digits, not a delta, and is not equivalent.                                                |
| `assert_empty o` (`:188`)                      | Array or string: `expect(o).toHaveLength(0)`; `Map`/`Set`/`Hash`: `expect(o.size).toBe(0)`; other: `expect(o.isEmpty()).toBe(true)` | Follow the receiver's `empty?`.                                                                                        |
| `assert_includes c, o` (`:260`)                | Array: `expect(c).toContainEqual(o)`; string: `expect(c).toContain(o)`; hash key: `expect(Object.hasOwn(c, o)).toBe(true)`          | `include?` compares with `==`, so use `toContainEqual`, not `toContain`, for arrays.                                   |
| `assert_match m, s` (`:293`)                   | `expect(s).toMatch(m)`                                                                                                              | A String `m` is escaped by Minitest, which matches `toMatch`'s substring check.                                        |
| `assert_instance_of cls, o` (`:271`)           | `expect(o.constructor).toBe(cls)`                                                                                                   | An exact class. `toBeInstanceOf` is `kind_of?`.                                                                        |
| `assert_kind_of cls, o` (`:282`)               | `expect(o).toBeInstanceOf(cls)`                                                                                                     |                                                                                                                        |
| `assert_predicate o, :foo?` (`:394`)           | `expect(o.isFoo()).toBe(true)`, or the `assert x` row if `foo?` returns a value                                                     | Spell the predicate directly, never through `rbFSend`.                                                                 |
| `assert_respond_to o, :m` (`:453`)             | `expect(rbObjRespondTo(o, "m")).toBe(true)`                                                                                         | `in` cannot see a `respond_to_missing?` name.                                                                          |
| `assert_operator a, :<, b` (`:315`)            | `toBeLessThan` / `toBeGreaterThan` / `…OrEqual`; otherwise `expect(a op b).toBe(true)`                                              |                                                                                                                        |
| `flunk msg` (`:624`)                           | `expect.unreachable(msg)`                                                                                                           |                                                                                                                        |
| `skip msg` (`:825`)                            | `ctx.skip()`, or `it.skip` under a `PERMANENT-SKIP:` line                                                                           |                                                                                                                        |

A Rails test that asserts on a Minitest failure message or `diff` output loses
that assertion permanently. Record it with a row in
`scripts/test-compare/assertion-receipts.ts`.

## Acceptance criteria

- The mapping table is in `CONTRIBUTING.md`, beside the porting guidance, and
  `CLAUDE.md` § "Ruby idioms that do not translate literally" points to it.
- `scripts/test-compare/assertion-kinds.ts` credits each form in the table
  with the kind of its Minitest counterpart. In particular, the
  truthiness/`rbEqual` `toBe(true)` forms credit `assert`/`equal`, the
  `Math.abs(...) <= d` form credits `inDelta` (the comparer maps
  `toBeCloseTo` to `inDelta` today), and `toBeInstanceOf` credits `kindOf`,
  not `instanceOf`.
- Every caller of the Minitest helpers listed above uses its `expect` form,
  and the helpers, `diff` and `message` are deleted from
  `testing/assertions.ts` and from the activesupport index re-exports.
  `ActiveSupport::Testing::Assertions` members stay.
- `pnpm parity:test --assertions` marks do not drop. `pnpm parity:api:extra:gate`
  is green, and activesupport's mark is lowered with `pnpm parity:api:extra:tighten`.
- The work goes beyond one PR. Ship the table and comparer change first, then
  convert callers one package at a time, filing each remaining package as its
  own story.
