---
title: "Sweep actionview (part 1 of 2) onto Vitest expect"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionview]
deps:
  [
    assertion-kinds-reads-literal-matcher-arguments,
    vitest-matcher-to-be-kind-of,
    vitest-matchers-to-include-scores-includes,
  ]
deps-rfc: []
est-loc: 590
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 20 test files make 284 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionview/src/actionpack/controller/render.test.ts` (2: assert 2)
- `packages/actionview/src/activerecord/controller-runtime.test.ts` (9: assertEqual 4, assertMatch 5)
- `packages/actionview/src/activerecord/debug-helper.test.ts` (4: assertMatch 4)
- `packages/actionview/src/activerecord/multifetch-cache.test.ts` (16: assertEqual 11, assertIncludes 4, assertNotPredicate 1)
- `packages/actionview/src/activerecord/partial-rendering-query.test.ts` (2: assertEqual 2)
- `packages/actionview/src/activerecord/polymorphic-routes.test.ts` (48: assertEqual 47, assertMatch 1)
- `packages/actionview/src/activerecord/relation-cache.test.ts` (1: assertEqual 1)
- `packages/actionview/src/activerecord/render-partial-with-record-identification.test.ts` (15: assertEqual 15)
- `packages/actionview/src/template/asset-tag-helper.test.ts` (50: assertEqual 39, assertNil 5, assertMatch 3, assertPredicate 3)
- `packages/actionview/src/template/capture-helper.test.ts` (8: assertNil 8)
- `packages/actionview/src/template/compiled-templates.test.ts` (7: assertEqual 7)
- `packages/actionview/src/template/controller-helper.test.ts` (4: assert 3, assertNil 1)
- `packages/actionview/src/template/date-helper.test.ts` (10: assertPredicate 10)
- `packages/actionview/src/template/digestor.test.ts` (3: assertNotNil 3)
- `packages/actionview/src/template/form-helper/form-with.test.ts` (7: assertEqual 4, assertMatch 2, assertNotIncludes 1)
- `packages/actionview/src/template/form-helper.test.ts` (7: assertEqual 4, assertNotIncludes 1, assertPredicate 2)
- `packages/actionview/src/template/form-options-helper.test.ts` (3: assertMatch 3)
- `packages/actionview/src/template/form-tag-helper.test.ts` (35: assertEqual 25, assertMatch 6, assertPredicate 4)
- `packages/actionview/src/template/html.test.ts` (1: assertNil 1)
- `packages/actionview/src/template/log-subscriber.test.ts` (52: assertEqual 20, assertMatch 32)

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
