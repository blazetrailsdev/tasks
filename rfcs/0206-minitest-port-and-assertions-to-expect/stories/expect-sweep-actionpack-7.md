---
title: "Sweep actionpack (part 7 of 10) onto Vitest expect"
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
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 13 test files make 188 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionpack/src/action-dispatch/dispatch/executor.test.ts` (8: assert 5, assertRespondTo 3)
- `packages/actionpack/src/action-dispatch/dispatch/header.test.ts` (4: assert 2, assertIncludes 2)
- `packages/actionpack/src/action-dispatch/dispatch/host-authorization.test.ts` (41: assertEqual 14, assertMatch 26, assertEmpty 1)
- `packages/actionpack/src/action-dispatch/dispatch/live-response.test.ts` (13: assert 1, assertEqual 8, assertNotEqual 1, assertNil 1, assertKindOf 2)
- `packages/actionpack/src/action-dispatch/dispatch/mapper.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-dispatch/dispatch/mime-type.test.ts` (30: assert 6, assertEqual 19, assertNotEqual 1, assertNil 1, assertOperator 2, assertRespondTo 1)
- `packages/actionpack/src/action-dispatch/dispatch/mount.test.ts` (13: assert 2, assertEqual 10, assertNotEqual 1)
- `packages/actionpack/src/action-dispatch/dispatch/permissions-policy.test.ts` (6: assertEqual 6)
- `packages/actionpack/src/action-dispatch/dispatch/prefix-generation.test.ts` (1: assertRespondTo 1)
- `packages/actionpack/src/action-dispatch/dispatch/reloader.test.ts` (7: assert 3, assertNil 1, assertRespondTo 3)
- `packages/actionpack/src/action-dispatch/dispatch/request/json-params-parsing.test.ts` (7: assert 1, assertEqual 6)
- `packages/actionpack/src/action-dispatch/dispatch/request/multipart-params-parsing.test.ts` (43: assert 1, assertEqual 40, assertNil 2)
- `packages/actionpack/src/action-dispatch/dispatch/request/session.test.ts` (14: assertEqual 4, assertNil 7, assertEmpty 3)

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
