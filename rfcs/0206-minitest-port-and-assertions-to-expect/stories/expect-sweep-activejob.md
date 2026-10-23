---
title: "Sweep activejob onto Vitest expect"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activejob]
deps:
  [
    assertion-kinds-reads-literal-matcher-arguments,
    vitest-matcher-to-be-kind-of,
    vitest-matchers-to-include-scores-includes,
  ]
deps-rfc: []
est-loc: 370
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 10 test files make 173 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activejob/src/adapter.test.ts` (1: assertEqual 1)
- `packages/activejob/src/job-serialization.test.ts` (16: assertEqual 12, assertNil 1, assertKindOf 3)
- `packages/activejob/src/logging.test.ts` (3: assertMatch 3)
- `packages/activejob/src/rescue.test.ts` (4: assertIncludes 3, assertNotIncludes 1)
- `packages/activejob/src/serializers.test.ts` (5: assert 1, assertEqual 4)
- `packages/activejob/src/serializers/time-with-zone-serializer.test.ts` (3: assertEqual 3)
- `packages/activejob/src/test-case.test.ts` (3: assertNil 1, assertIncludes 1, assertKindOf 1)
- `packages/activejob/src/test-helper.test.ts` (133: assertEqual 31, assertNil 11, assertMatch 83, assertInDelta 2, assertInstanceOf 6)
- `packages/activejob/src/timezones.test.ts` (4: assertEqual 4)
- `packages/activejob/src/translation.test.ts` (1: assertEqual 1)

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
      matcher (existing, or the RFC's `toBeKindOf` / `toInclude`) only where
      the built-in is wrong for that value.
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
