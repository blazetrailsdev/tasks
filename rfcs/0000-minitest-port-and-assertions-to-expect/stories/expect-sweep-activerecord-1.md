---
title: "Sweep activerecord (part 1 of 5) onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activerecord]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 31 test files make 286 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/activerecord/src/active-record.test.ts` (3: assertPredicate 2, assertNotPredicate 1)
- `packages/activerecord/src/adapter-prevent-writes.test.ts` (3: assertPredicate 1, assertNotPredicate 2)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/auto-increment.test.ts` (2: assertNotPredicate 2)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/case-sensitivity.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts` (10: assert 3, assertEmpty 1, assertPredicate 5, assertNotPredicate 1)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-enum.test.ts` (2: assertNotPredicate 2)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/transaction.test.ts` (1: assertPredicate 1)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/unsigned-type.test.ts` (1: assertPredicate 1)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/virtual-column.test.ts` (3: assertPredicate 3)
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts` (2: assert 1, assertIncludes 1)
- `packages/activerecord/src/adapters/postgresql/bit-string.test.ts` (5: assert 1, assertNotPredicate 4)
- `packages/activerecord/src/adapters/postgresql/bytea.test.ts` (7: assert 3, assertEqual 1, assertNotPredicate 3)
- `packages/activerecord/src/adapters/postgresql/change-schema.test.ts` (1: assertPredicate 1)
- `packages/activerecord/src/adapters/postgresql/connection.test.ts` (1: assertEmpty 1)
- `packages/activerecord/src/adapters/postgresql/domain.test.ts` (2: assertNotPredicate 2)
- `packages/activerecord/src/adapters/postgresql/enum.test.ts` (9: assert 5, assertPredicate 2, assertNotPredicate 2)
- `packages/activerecord/src/adapters/postgresql/geometric.test.ts` (6: assertNotPredicate 6)
- `packages/activerecord/src/adapters/postgresql/hstore.test.ts` (1: assertRespondTo 1)
- `packages/activerecord/src/adapters/postgresql/uuid.test.ts` (12: assert 3, assertEmpty 2, assertPredicate 2, assertNotPredicate 5)
- `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` (2: assertRespondTo 2)
- `packages/activerecord/src/adapters/sqlite3/transaction.test.ts` (1: assertNotEmpty 1)
- `packages/activerecord/src/adapter.test.ts` (6: assertEmpty 5, assertNotEmpty 1)
- `packages/activerecord/src/associations/belongs-to-associations.test.ts` (42: assert 10, assertEmpty 1, assertSame 1, assertPredicate 22, assertNotPredicate 8)
- `packages/activerecord/src/associations/callbacks.test.ts` (8: assertEmpty 8)
- `packages/activerecord/src/associations/eager.test.ts` (6: assertNotEmpty 3, assertIncludes 2, assertPredicate 1)
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` (55: assert 10, assertEmpty 11, assertNotEmpty 6, assertRespondTo 3, assertPredicate 11, assertNotPredicate 14)
- `packages/activerecord/src/associations/has-many-associations.test.ts` (16: assertEmpty 5, assertNotEmpty 11)
- `packages/activerecord/src/associations/has-many-through-associations.test.ts` (17: assertEmpty 11, assertNotEmpty 4, assertIncludes 2)
- `packages/activerecord/src/associations/has-one-associations.test.ts` (26: assert 6, assertNotEmpty 2, assertPredicate 16, assertNotPredicate 2)
- `packages/activerecord/src/associations/has-one-through-associations.test.ts` (21: assert 4, assertPredicate 14, assertNotPredicate 3)
- `packages/activerecord/src/associations/inner-join-association.test.ts` (13: assert 5, assertEmpty 2, assertNotEmpty 6)

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
