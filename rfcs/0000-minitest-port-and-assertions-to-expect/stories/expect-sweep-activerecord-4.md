---
title: "Sweep activerecord (part 4 of 5) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activerecord]
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
sweep must not do"). These 34 test files make 295 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activerecord/src/base.test.ts` (99: assert 40, assertEqual 2, assertNotEmpty 2, assertRespondTo 9, assertNotRespondTo 13, assertPredicate 19, assertNotPredicate 14)
- `packages/activerecord/src/batches.test.ts` (10: assertEqual 10)
- `packages/activerecord/src/calculations.test.ts` (9: assert 3, assertPredicate 4, assertNotPredicate 2)
- `packages/activerecord/src/collection-cache-key.test.ts` (1: assertNotPredicate 1)
- `packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts` (11: assertNotNil 11)
- `packages/activerecord/src/connection-adapters/statement-pool.test.ts` (3: assertNil 1, assertSame 2)
- `packages/activerecord/src/connection-management.test.ts` (1: assertRespondTo 1)
- `packages/activerecord/src/connection-pool.test.ts` (1: assertRespondTo 1)
- `packages/activerecord/src/date-time.test.ts` (2: assertEqual 1, assertInDelta 1)
- `packages/activerecord/src/delegated-type.test.ts` (1: assertRespondTo 1)
- `packages/activerecord/src/dirty.test.ts` (4: assertInDelta 1, assertEmpty 3)
- `packages/activerecord/src/enum.test.ts` (21: assertEmpty 2, assertRespondTo 19)
- `packages/activerecord/src/excluding.test.ts` (6: assertEmpty 2, assertNotEmpty 4)
- `packages/activerecord/src/explain-subscriber.test.ts` (5: assertEmpty 5)
- `packages/activerecord/src/finder-respond-to.test.ts` (13: assertRespondTo 7, assertNotRespondTo 6)
- `packages/activerecord/src/finder.test.ts` (18: assertEqual 14, assertNotEmpty 2, assertKindOf 1, assertRespondTo 1)
- `packages/activerecord/src/fixtures.test.ts` (3: assertInDelta 1, assertNotEmpty 2)
- `packages/activerecord/src/forbidden-attributes-protection.test.ts` (1: assertEmpty 1)
- `packages/activerecord/src/habtm-destroy-order.test.ts` (2: assertNotEmpty 2)
- `packages/activerecord/src/hot-compatibility.test.ts` (2: assertEmpty 2)
- `packages/activerecord/src/inheritance.test.ts` (28: assert 1, assertPredicate 15, assertNotPredicate 12)
- `packages/activerecord/src/insert-all.test.ts` (5: assertInDelta 2, assertEmpty 3)
- `packages/activerecord/src/invertible-migration.test.ts` (3: assertEmpty 3)
- `packages/activerecord/src/json-serialization.test.ts` (1: assertNotRespondTo 1)
- `packages/activerecord/src/locking.test.ts` (3: assertEmpty 2, assertNotEmpty 1)
- `packages/activerecord/src/message-pack.test.ts` (13: assertEqual 10, assertSame 3)
- `packages/activerecord/src/migration/command-recorder.test.ts` (2: assertRespondTo 2)
- `packages/activerecord/src/migration/compatibility.test.ts` (1: assertMatch 1)
- `packages/activerecord/src/migration/foreign-key.test.ts` (11: assertEmpty 11)
- `packages/activerecord/src/migration/schema-definitions.test.ts` (3: assertPredicate 3)
- `packages/activerecord/src/migration.test.ts` (5: assertInDelta 1, assertEmpty 4)
- `packages/activerecord/src/migration/unique-constraint.test.ts` (2: assertEmpty 2)
- `packages/activerecord/src/modules.test.ts` (3: assertEqual 1, assertNil 1, assertNotNil 1)
- `packages/activerecord/src/multiparameter-attributes.test.ts` (2: assertNotRespondTo 2)

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
