---
title: "Sweep actionpack (part 1 of 10) onto Vitest expect"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionpack]
deps:
  [
    assertion-kinds-reads-literal-matcher-arguments,
    vitest-matcher-to-be-kind-of,
    vitest-matchers-to-include-scores-includes,
  ]
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
sweep must not do"). These 23 test files make 291 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionpack/src/abstract-controller/callbacks.test.ts` (9: assertIncludes 9)
- `packages/actionpack/src/abstract-controller/collector.test.ts` (5: assertRespondTo 3, assertNotRespondTo 2)
- `packages/actionpack/src/abstract-controller/translation.test.ts` (4: assertRespondTo 4)
- `packages/actionpack/src/action-controller/base-params-wrapper.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts` (25: assert 9, assertEqual 9, assertNil 1, assertEmpty 2, assertIncludes 1, assertKindOf 1, assertPredicate 2)
- `packages/actionpack/src/action-controller/controller/allow-browser.test.ts` (3: assertEqual 1, assertEmpty 1, assertNotEmpty 1)
- `packages/actionpack/src/action-controller/controller/api/conditional-get.test.ts` (4: assertEqual 3, assertPredicate 1)
- `packages/actionpack/src/action-controller/controller/api/data-streaming.test.ts` (2: assertEqual 1, assertKindOf 1)
- `packages/actionpack/src/action-controller/controller/api/params-wrapper.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/api/redirect-to.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/api/renderers.test.ts` (3: assertEqual 3)
- `packages/actionpack/src/action-controller/controller/api/url-for.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/api/with-cookies.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/api/with-helpers.test.ts` (2: assertEqual 2)
- `packages/actionpack/src/action-controller/controller/base.test.ts` (40: assert 4, assertEqual 34, assertIncludes 1, assertNotIncludes 1)
- `packages/actionpack/src/action-controller/controller/caching.test.ts` (57: assert 1, assertEqual 37, assertNil 10, assertMatch 7, assertEmpty 1, assertPredicate 1)
- `packages/actionpack/src/action-controller/controller/chunked.test.ts` (2: assertEqual 2)
- `packages/actionpack/src/action-controller/controller/content-type.test.ts` (26: assertEqual 25, assertNil 1)
- `packages/actionpack/src/action-controller/controller/filters.test.ts` (11: assert 11)
- `packages/actionpack/src/action-controller/controller/flash-hash.test.ts` (38: assert 2, assertEqual 28, assertNil 5, assertEmpty 2, assertNotEmpty 1)
- `packages/actionpack/src/action-controller/controller/flash.test.ts` (39: assertEqual 22, assertNotEqual 2, assertNil 13, assertRespondTo 2)
- `packages/actionpack/src/action-controller/controller/form-builder.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-controller/controller/integration.test.ts` (15: assert 2, assertEqual 6, assertIncludes 2, assertNotIncludes 1, assertInstanceOf 1, assertKindOf 3)

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
