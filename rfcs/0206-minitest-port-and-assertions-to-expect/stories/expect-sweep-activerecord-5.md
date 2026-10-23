---
title: "Sweep activerecord (part 5 of 5) onto Vitest expect"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activerecord]
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
sweep must not do"). These 27 test files make 197 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activerecord/src/nested-attributes.test.ts` (8: assertEmpty 5, assertRespondTo 3)
- `packages/activerecord/src/persistence.test.ts` (2: assertEmpty 2)
- `packages/activerecord/src/query-cache.test.ts` (15: assert 10, assertPredicate 2, assertNotPredicate 3)
- `packages/activerecord/src/readonly.test.ts` (1: assertNotEmpty 1)
- `packages/activerecord/src/reflection.test.ts` (7: assert 1, assertEmpty 2, assertNotEmpty 1, assertIncludes 3)
- `packages/activerecord/src/relation/delegation.test.ts` (4: assertRespondTo 3, assertNotRespondTo 1)
- `packages/activerecord/src/relation/field-ordered-values.test.ts` (1: assertEmpty 1)
- `packages/activerecord/src/relation/merging.test.ts` (2: assertEmpty 1, assertNotEmpty 1)
- `packages/activerecord/src/relations.test.ts` (84: assertEmpty 7, assertNotEmpty 1, assertRespondTo 3, assertNotRespondTo 2, assertPredicate 43, assertNotPredicate 28)
- `packages/activerecord/src/relation.test.ts` (6: assert 4, assertNotRespondTo 2)
- `packages/activerecord/src/relation/where-clause.test.ts` (2: assertEmpty 1, assertNotEmpty 1)
- `packages/activerecord/src/relation/where.test.ts` (6: assertEmpty 6)
- `packages/activerecord/src/result.test.ts` (1: assert 1)
- `packages/activerecord/src/schema-loading.test.ts` (3: assertEqual 3)
- `packages/activerecord/src/scoping/default-scoping.test.ts` (2: assertEmpty 1, assertNotEmpty 1)
- `packages/activerecord/src/scoping/named-scoping.test.ts` (13: assertNotEmpty 10, assertRespondTo 3)
- `packages/activerecord/src/secure-password.test.ts` (1: assertInDelta 1)
- `packages/activerecord/src/shard-keys.test.ts` (2: assertEmpty 2)
- `packages/activerecord/src/tasks/database-tasks.test.ts` (6: assertEmpty 6)
- `packages/activerecord/src/timestamp.test.ts` (3: assertInDelta 3)
- `packages/activerecord/src/touch-later.test.ts` (2: assertNotPredicate 2)
- `packages/activerecord/src/transaction-callbacks.test.ts` (6: assertEmpty 6)
- `packages/activerecord/src/transaction-instrumentation.test.ts` (5: assertEmpty 1, assertSame 4)
- `packages/activerecord/src/type/string.test.ts` (3: assertPredicate 1, assertNotPredicate 2)
- `packages/activerecord/src/unsafe-raw-sql.test.ts` (1: assertNotEmpty 1)
- `packages/activerecord/src/validations.test.ts` (3: assertEmpty 2, assertNotEmpty 1)
- `packages/activerecord/src/validations/uniqueness-validation.test.ts` (8: assertEmpty 8)

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
