---
title: "Sweep activemodel (part 1 of 2) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activemodel]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 580
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 29 test files make 280 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activemodel/src/attribute-methods.test.ts` (7: assertRespondTo 5, assertNotRespondTo 2)
- `packages/activemodel/src/attribute-registration.test.ts` (1: assertNil 1)
- `packages/activemodel/src/attributes-dirty.test.ts` (26: assert 5, assertNil 1, assertNotNil 2, assertPredicate 7, assertNotPredicate 11)
- `packages/activemodel/src/attribute-set.test.ts` (6: assertNil 6)
- `packages/activemodel/src/attributes.test.ts` (1: assertNil 1)
- `packages/activemodel/src/callbacks.test.ts` (10: assertEmpty 1, assertRespondTo 3, assertNotRespondTo 6)
- `packages/activemodel/src/conversion.test.ts` (4: assertNil 4)
- `packages/activemodel/src/dirty.test.ts` (31: assert 8, assertNil 1, assertNotNil 2, assertPredicate 8, assertNotPredicate 12)
- `packages/activemodel/src/errors.test.ts` (16: assertNil 1, assertEmpty 4, assertNotEmpty 1, assertIncludes 3, assertNotIncludes 1, assertSame 1, assertNotSame 1, assertNotRespondTo 1, assertPredicate 2, assertNotPredicate 1)
- `packages/activemodel/src/error.test.ts` (1: assertNotRespondTo 1)
- `packages/activemodel/src/naming.test.ts` (1: assert 1)
- `packages/activemodel/src/secure-password.test.ts` (7: assertNil 5, assertRespondTo 1, assertNotRespondTo 1)
- `packages/activemodel/src/type/binary.test.ts` (1: assertNil 1)
- `packages/activemodel/src/type/boolean.test.ts` (2: assertPredicate 2)
- `packages/activemodel/src/type/date.test.ts` (5: assertNil 5)
- `packages/activemodel/src/type/date-time.test.ts` (5: assertNil 5)
- `packages/activemodel/src/type/decimal.test.ts` (1: assertNil 1)
- `packages/activemodel/src/type/float.test.ts` (1: assertNil 1)
- `packages/activemodel/src/type/immutable-string.test.ts` (2: assertSame 2)
- `packages/activemodel/src/type/integer.test.ts` (12: assertNil 12)
- `packages/activemodel/src/type/time.test.ts` (8: assertNil 8)
- `packages/activemodel/src/validations/absence-validation.test.ts` (9: assertPredicate 9)
- `packages/activemodel/src/validations/acceptance-validation.test.ts` (17: assert 4, assertPredicate 13)
- `packages/activemodel/src/validations/callbacks.test.ts` (2: assertEmpty 2)
- `packages/activemodel/src/validations/comparison-validation.test.ts` (3: assertPredicate 3)
- `packages/activemodel/src/validations/conditional-validation.test.ts` (28: assertEmpty 7, assertPredicate 21)
- `packages/activemodel/src/validations/confirmation-validation.test.ts` (14: assertPredicate 14)
- `packages/activemodel/src/validations/exclusion-validation.test.ts` (32: assert 2, assertPredicate 30)
- `packages/activemodel/src/validations/format-validation.test.ts` (27: assertEmpty 4, assertPredicate 23)

Each helper's replacement and the question to ask at each site are in the
RFC's disposition table. The Ruby being ported is in
`vendor/minitest/v5.27.0/lib/minitest/assertions.rb`; CONTRIBUTING.md
§ "Porting a Minitest assertion" is the ratified table.

## Acceptance criteria

- [ ] No file listed above imports or calls a Minitest assertion helper
      (`assert`, `assertEqual`, `assertNil`, `assertPredicate`, `assertEmpty`,
      `assertMatch`, `assertRespondTo`, … and their negations). Rails'
      `ActiveSupport::Testing::Assertions` members (`assertNot`,
      `assertRaises`, `assertNothingRaised`, `assertDifference`,
      `assertChanges`, …) are untouched.
- [ ] Each call becomes exactly one `expect`, chosen per the RFC table:
      the built-in by default, an existing `@blazetrails/vitest-matchers`
      matcher only where the built-in is wrong for that value. No new matcher.
- [ ] `assertNil` / `assertNotNil` map to the JS value the code under test
      produces: `toBeNull` / `.not.toBeNull` for `null`,
      `toBeUndefined` / `toBeDefined` for `undefined`. A value that can be
      both is filed against the package's `surfaced-deviations` RFC, not
      papered over.
- [ ] `assertPredicate` / `assert` sites on a value that can be `0` or
      `""` use `toBeRubyTruthy`; `assertEqual` sites where either side
      defines Ruby `==` use `toEqualRuby`; an async `isEmpty` /
      `isInclude` is awaited before the matcher.
- [ ] No `describe` / `it` / `test` title changes:
      `git diff -U0 origin/main... | rg '^[-+].*\b(it|describe|test)(\.\w+)?\("'` shows no
      title line.
- [ ] Every touched file passes `pnpm vitest run <file>`.
- [ ] `pnpm parity:test` then `pnpm parity:test:assertions` green: no
      package's count, kind or value counter rises.

## Definition of done

A file left half-converted does not close this story, and neither does a
`toBeTruthy` on a value that can be `0` or `""` because the test went green.
