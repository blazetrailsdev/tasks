---
title: "Sweep actionpack (part 3 of 10) onto Vitest expect"
status: ready
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionpack]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 470
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 8 test files make 224 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionpack/src/action-controller/controller/parameters/accessors.test.ts` (112: assert 28, assertEqual 18, assertNil 1, assertMatch 2, assertEmpty 1, assertNotEmpty 1, assertSame 3, assertKindOf 22, assertPredicate 19, assertNotPredicate 17)
- `packages/actionpack/src/action-controller/controller/parameters/always-permitted-parameters.test.ts` (2: assertEqual 1, assertPredicate 1)
- `packages/actionpack/src/action-controller/controller/parameters/dup.test.ts` (4: assert 2, assertNotEqual 2)
- `packages/actionpack/src/action-controller/controller/parameters/equality.test.ts` (5: assert 4, assertNotEqual 1)
- `packages/actionpack/src/action-controller/controller/parameters/multi-parameter-attributes.test.ts` (1: assert 1)
- `packages/actionpack/src/action-controller/controller/parameters/mutators.test.ts` (39: assertEqual 8, assertNil 2, assertInstanceOf 1, assertPredicate 14, assertNotPredicate 14)
- `packages/actionpack/src/action-controller/controller/parameters/nested-parameters-permit.test.ts` (45: assertEqual 30, assertNil 4, assertNotNil 7, assertEmpty 3, assertPredicate 1)
- `packages/actionpack/src/action-controller/controller/parameters/parameters-expect.test.ts` (16: assertEqual 15, assertPredicate 1)

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
