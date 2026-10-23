---
title: "Sweep activesupport (part 2 of 2) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activesupport]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 39 test files make 315 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activesupport/src/core-ext/string-ext.test.ts` (55: assert 5, assertNil 1, assertNotSame 3, assertRespondTo 1, assertPredicate 32, assertNotPredicate 13)
- `packages/activesupport/src/core-ext/symbol-ext.test.ts` (6: assert 6)
- `packages/activesupport/src/core-ext/time-ext.test.ts` (3: assertNil 1, assertPredicate 2)
- `packages/activesupport/src/core-ext/time-with-zone.test.ts` (27: assert 3, assertNil 10, assertRespondTo 1, assertNotRespondTo 6, assertPredicate 6, assertNotPredicate 1)
- `packages/activesupport/src/current-attributes.test.ts` (3: assertNil 2, assertSame 1)
- `packages/activesupport/src/deprecation/deprecators.test.ts` (6: assertPredicate 2, assertNotPredicate 4)
- `packages/activesupport/src/deprecation/method-wrappers.test.ts` (2: assert 2)
- `packages/activesupport/src/deprecation/proxy-wrappers.test.ts` (3: assertPredicate 3)
- `packages/activesupport/src/deprecation.test.ts` (9: assert 3, assertEmpty 1, assertNotEmpty 2, assertIncludes 1, assertSame 2)
- `packages/activesupport/src/encrypted-configuration.test.ts` (12: assertEqual 10, assertMatch 1, assertNoMatch 1)
- `packages/activesupport/src/encrypted-file.test.ts` (5: assert 2, assertPredicate 3)
- `packages/activesupport/src/environment-inquirer.test.ts` (2: assertPredicate 2)
- `packages/activesupport/src/error-reporter.test.ts` (6: assertNil 4, assertNotNil 1, assertSame 1)
- `packages/activesupport/src/executor.test.ts` (1: assertNil 1)
- `packages/activesupport/src/hash-with-indifferent-access.test.ts` (7: assertNil 3, assertIncludes 2, assertInstanceOf 2)
- `packages/activesupport/src/inflector.test.ts` (19: assert 1, assertEmpty 15, assertNotEmpty 3)
- `packages/activesupport/src/json/decoding.test.ts` (1: assertNil 1)
- `packages/activesupport/src/json/encoding.test.ts` (1: assertNil 1)
- `packages/activesupport/src/log-subscriber.test.ts` (6: assertEmpty 4, assertNotEmpty 2)
- `packages/activesupport/src/message-encryptors.test.ts` (2: assertNil 2)
- `packages/activesupport/src/message-pack/cache-serializer.test.ts` (1: assertNotNil 1)
- `packages/activesupport/src/messages/serializer-with-fallback.test.ts` (1: assert 1)
- `packages/activesupport/src/message-verifiers.test.ts` (1: assertNil 1)
- `packages/activesupport/src/message-verifier.test.ts` (2: assertNil 2)
- `packages/activesupport/src/multibyte-chars.test.ts` (49: assert 25, assertNil 14, assertIncludes 3, assertNotIncludes 2, assertRespondTo 3, assertNotRespondTo 1, assertPredicate 1)
- `packages/activesupport/src/notifications/instrumenter.test.ts` (8: assert 2, assertNotNil 4, assertEmpty 2)
- `packages/activesupport/src/notifications.test.ts` (1: assertEmpty 1)
- `packages/activesupport/src/number-helper.test.ts` (7: assertNil 7)
- `packages/activesupport/src/option-merger.test.ts` (1: assertNotSame 1)
- `packages/activesupport/src/ordered-options.test.ts` (3: assertRespondTo 3)
- `packages/activesupport/src/safe-buffer.test.ts` (20: assert 3, assertNil 1, assertNotNil 1, assertPredicate 13, assertNotPredicate 2)
- `packages/activesupport/src/security.test.ts` (2: assertNil 2)
- `packages/activesupport/src/share-lock.test.ts` (7: assert 3, assertEqual 2, assertEmpty 2)
- `packages/activesupport/src/silence-logger.test.ts` (3: assertEmpty 1, assertPredicate 2)
- `packages/activesupport/src/string-inquirer.test.ts` (6: assertRespondTo 3, assertNotRespondTo 1, assertPredicate 1, assertNotPredicate 1)
- `packages/activesupport/src/tagged-logging.test.ts` (5: assertNil 1, assertNotNil 1, assertRespondTo 3)
- `packages/activesupport/src/test-case.test.ts` (6: assert 1, assertNil 1, assertIncludes 4)
- `packages/activesupport/src/time-zone.test.ts` (15: assert 9, assertNil 5, assertSame 1)
- `packages/activesupport/src/transliterate.test.ts` (1: assert 1)

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
