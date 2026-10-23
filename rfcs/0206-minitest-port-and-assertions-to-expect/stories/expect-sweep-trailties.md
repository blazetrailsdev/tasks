---
title: "Sweep trailties onto Vitest expect"
status: draft
updated: 2026-10-22
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [trailties]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 510
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 14 test files make 242 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/trailties/src/application/configuration/custom.test.ts` (2: assertNil 1, assertRespondTo 1)
- `packages/trailties/src/application/configuration.test.ts` (4: assertNil 2, assertNotNil 2)
- `packages/trailties/src/application/generators.test.ts` (1: assertNoMatch 1)
- `packages/trailties/src/generators/app-generator.test.ts` (3: assertNoMatch 3)
- `packages/trailties/src/generators/migration-generator.test.ts` (80: assertMatch 68, assertNoMatch 12)
- `packages/trailties/src/generators/model-generator.test.ts` (47: assertMatch 39, assertNoMatch 8)
- `packages/trailties/src/generators/rails/resource/resource-generator.test.ts` (2: assertMatch 2)
- `packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.test.ts` (38: assertMatch 36, assertNoMatch 2)
- `packages/trailties/src/generators/rails/scaffold/scaffold-generator.test.ts` (1: assertNoMatch 1)
- `packages/trailties/src/info-controller.test.ts` (56: assert 55, assertNil 1)
- `packages/trailties/src/thor/line-editor/basic.test.ts` (1: assertPredicate 1)
- `packages/trailties/src/thor/nested-context.test.ts` (2: assertPredicate 1, assertNotPredicate 1)
- `packages/trailties/src/thor/parser/option.test.ts` (4: assertPredicate 4)
- `packages/trailties/src/thor/util.test.ts` (1: assertEmpty 1)

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
