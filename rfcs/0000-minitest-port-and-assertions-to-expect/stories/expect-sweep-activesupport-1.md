---
title: "Sweep activesupport (part 1 of 2) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activesupport]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 530
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 41 test files make 255 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activesupport/src/actionable-error.test.ts` (2: assertPredicate 2)
- `packages/activesupport/src/array-inquirer.test.ts` (12: assert 5, assertRespondTo 3, assertNotRespondTo 1, assertPredicate 2, assertNotPredicate 1)
- `packages/activesupport/src/backtrace-cleaner.test.ts` (2: assertEmpty 2)
- `packages/activesupport/src/benchmarkable.test.ts` (1: assertEmpty 1)
- `packages/activesupport/src/benchmark.test.ts` (2: assertIncludes 2)
- `packages/activesupport/src/broadcast-logger.test.ts` (9: assertNil 4, assertEmpty 1, assertSame 1, assertNotSame 1, assertRespondTo 1, assertNotRespondTo 1)
- `packages/activesupport/src/cache/cache-store-namespace.test.ts` (2: assert 2)
- `packages/activesupport/src/cache/serializer-with-fallback.test.ts` (4: assertNil 3, assertNotNil 1)
- `packages/activesupport/src/cache/stores/file-store.test.ts` (12: assert 10, assertEmpty 1, assertPredicate 1)
- `packages/activesupport/src/cache/stores/memory-store.test.ts` (23: assert 19, assertNil 3, assertSame 1)
- `packages/activesupport/src/cache/stores/null-store.test.ts` (8: assertNil 8)
- `packages/activesupport/src/cache.test.ts` (10: assertNil 10)
- `packages/activesupport/src/callback-inheritance.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/concern.test.ts` (3: assertNil 2, assertNotRespondTo 1)
- `packages/activesupport/src/core-ext/array/wrap.test.ts` (1: assertSame 1)
- `packages/activesupport/src/core-ext/class/attribute.test.ts` (8: assertNotRespondTo 7, assertPredicate 1)
- `packages/activesupport/src/core-ext/date-and-time-compatibility.test.ts` (10: assertPredicate 1, assertNotPredicate 9)
- `packages/activesupport/src/core-ext/date-ext.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/core-ext/date-time-ext.test.ts` (4: assertNil 1, assertPredicate 2, assertNotPredicate 1)
- `packages/activesupport/src/core-ext/duration.test.ts` (1: assertNil 1)
- `packages/activesupport/src/core-ext/enumerable.test.ts` (1: assertEqual 1)
- `packages/activesupport/src/core-ext/file.test.ts` (7: assert 6, assertNil 1)
- `packages/activesupport/src/core-ext/hash-ext.test.ts` (19: assertNil 1, assertRespondTo 15, assertPredicate 3)
- `packages/activesupport/src/core-ext/kernel.test.ts` (1: assertNil 1)
- `packages/activesupport/src/core-ext/module/anonymous.test.ts` (4: assertPredicate 2, assertNotPredicate 2)
- `packages/activesupport/src/core-ext/module/attribute-accessor-per-thread.test.ts` (15: assertNil 3, assertSame 1, assertRespondTo 5, assertNotRespondTo 4, assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/core-ext/module/attribute-accessor.test.ts` (9: assertRespondTo 5, assertNotRespondTo 4)
- `packages/activesupport/src/core-ext/module/attribute-aliasing.test.ts` (7: assertPredicate 4, assertNotPredicate 3)
- `packages/activesupport/src/core-ext/module/attr-internal.test.ts` (1: assert 1)
- `packages/activesupport/src/core-ext/module/concerning.test.ts` (13: assert 5, assertRespondTo 6, assertNotRespondTo 2)
- `packages/activesupport/src/core-ext/module/introspection.test.ts` (2: assertNil 2)
- `packages/activesupport/src/core-ext/module/remove-method.test.ts` (5: assert 3, assertNotRespondTo 2)
- `packages/activesupport/src/core-ext/module.test.ts` (30: assert 12, assertNil 1, assertRespondTo 3, assertNotRespondTo 13, assertPredicate 1)
- `packages/activesupport/src/core-ext/name-error.test.ts` (3: assert 2, assertNil 1)
- `packages/activesupport/src/core-ext/object/blank.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/core-ext/object/duplicable.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/core-ext/object/inclusion.test.ts` (1: assertNil 1)
- `packages/activesupport/src/core-ext/object/to-param.test.ts` (1: assertNil 1)
- `packages/activesupport/src/core-ext/object/to-query.trails.test.ts` (4: assertEqual 4)
- `packages/activesupport/src/core-ext/object/try.test.ts` (4: assertNotRespondTo 4)
- `packages/activesupport/src/core-ext/object/with.test.ts` (6: assertNotRespondTo 6)

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
