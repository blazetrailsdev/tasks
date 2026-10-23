---
title: "Sweep actionview (part 2 of 2) onto Vitest expect"
status: ready
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionview]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 610
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 14 test files make 295 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionview/src/template/lookup-context.test.ts` (39: assert 2, assertEqual 28, assertNotEqual 1, assertNil 1, assertMatch 3, assertSame 2, assertKindOf 1, assertPredicate 1)
- `packages/actionview/src/template/number-helper.test.ts` (7: assertNil 7)
- `packages/actionview/src/template/partial-iteration.test.ts` (4: assertEqual 2, assertPredicate 2)
- `packages/actionview/src/template/render.test.ts` (113: assert 2, assertEqual 73, assertNotEqual 4, assertNil 5, assertMatch 22, assertNoMatch 4, assertIncludes 2, assertInstanceOf 1)
- `packages/actionview/src/template/sanitize-helper.test.ts` (11: assertEqual 3, assertKindOf 4, assertRespondTo 4)
- `packages/actionview/src/template/tag-helper.test.ts` (1: assertRespondTo 1)
- `packages/actionview/src/template/template-error.test.ts` (4: assertEqual 4)
- `packages/actionview/src/template/test-case.test.ts` (69: assert 4, assertEqual 32, assertNil 2, assertMatch 4, assertIncludes 12, assertNotIncludes 6, assertSame 2, assertKindOf 6, assertNotRespondTo 1)
- `packages/actionview/src/template/testing/fixture-resolver.test.ts` (18: assertEqual 17, assertNil 1)
- `packages/actionview/src/template/testing/null-resolver.test.ts` (4: assertEqual 3, assertNil 1)
- `packages/actionview/src/template/test.test.ts` (8: assertEqual 8)
- `packages/actionview/src/template/text-helper.test.ts` (1: assertNil 1)
- `packages/actionview/src/template/url-helper.test.ts` (3: assertPredicate 3)
- `packages/actionview/src/testing/selector-assertions.test.ts` (13: assertEqual 13)

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
