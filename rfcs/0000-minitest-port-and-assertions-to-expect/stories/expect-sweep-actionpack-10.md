---
title: "Sweep actionpack (part 10 of 10) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionpack]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 15 test files make 196 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts` (33: assertEqual 16, assertNotEqual 6, assertNil 4, assertNotNil 3, assertMatch 2, assertNoMatch 2)
- `packages/actionpack/src/action-dispatch/dispatch/session/test-session.test.ts` (2: assertEqual 1, assertInstanceOf 1)
- `packages/actionpack/src/action-dispatch/dispatch/show-exceptions.test.ts` (20: assertEqual 16, assertMatch 3, assertKindOf 1)
- `packages/actionpack/src/action-dispatch/dispatch/ssl.test.ts` (6: assertEqual 4, assertNil 2)
- `packages/actionpack/src/action-dispatch/dispatch/static.test.ts` (43: assert 1, assertEqual 36, assertNotEqual 2, assertNil 4)
- `packages/actionpack/src/action-dispatch/dispatch/system-testing/screenshot-helper.test.ts` (18: assert 3, assertEqual 15)
- `packages/actionpack/src/action-dispatch/dispatch/system-testing/server.test.ts` (2: assert 1, assertNotEqual 1)
- `packages/actionpack/src/action-dispatch/dispatch/test-request.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts` (3: assertEqual 2, assertKindOf 1)
- `packages/actionpack/src/action-dispatch/dispatch/uploaded-file.test.ts` (8: assertEqual 5, assertNil 1, assertPredicate 2)
- `packages/actionpack/src/action-dispatch/dispatch/url-generation.test.ts` (48: assertEqual 48)
- `packages/actionpack/src/action-dispatch/journey/nodes/ast.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/actionpack/src/action-dispatch/journey/routes.test.ts` (5: assertEmpty 4, assertNotEmpty 1)
- `packages/actionpack/src/action-dispatch/system-test-case.system.test.ts` (1: assertEqual 1)
- `packages/actionpack/src/action-dispatch/testing/integration.test.ts` (4: assertEqual 4)

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
