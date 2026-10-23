---
title: "Sweep actionpack (part 2 of 10) onto Vitest expect"
status: ready
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [actionpack]
deps: [assertion-kinds-reads-literal-matcher-arguments]
deps-rfc: []
est-loc: 490
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

One bin of the RFC's test-code sweep (§ "Per-helper disposition", § "What a
sweep must not do"). These 12 test files make 232 calls to Minitest
helpers imported from `@blazetrails/activesupport` or a relative
`testing/assertions.js` (count: the import-resolved command in the RFC's
§ Measurements, run 2026-10-22 on trails `1b769d8daa`). Per file, helper and
call count:

- `packages/actionpack/src/action-controller/controller/live-stream.test.ts` (70: assert 4, assertEqual 34, assertNil 1, assertMatch 28, assertPredicate 3)
- `packages/actionpack/src/action-controller/controller/localized-templates.test.ts` (6: assertEqual 6)
- `packages/actionpack/src/action-controller/controller/log-subscriber.test.ts` (74: assertEqual 44, assertNil 1, assertMatch 25, assertNoMatch 4)
- `packages/actionpack/src/action-controller/controller/metal/renderers.test.ts` (4: assertEqual 4)
- `packages/actionpack/src/action-controller/controller/metal.test.ts` (1: assertMatch 1)
- `packages/actionpack/src/action-controller/controller/new-base/bare-metal.test.ts` (43: assert 4, assertEqual 12, assertNil 15, assertEmpty 6, assertKindOf 1, assertPredicate 5)
- `packages/actionpack/src/action-controller/controller/new-base/base.test.ts` (21: assertEqual 21)
- `packages/actionpack/src/action-controller/controller/new-base/render-body.test.ts` (2: assertEqual 2)
- `packages/actionpack/src/action-controller/controller/new-base/render-implicit-action.test.ts` (5: assert 3, assertEqual 2)
- `packages/actionpack/src/action-controller/controller/new-base/render-streaming.test.ts` (2: assertEqual 1, assertMatch 1)
- `packages/actionpack/src/action-controller/controller/new-base/render-template.test.ts` (1: assertMatch 1)
- `packages/actionpack/src/action-controller/controller/output-escaping.test.ts` (3: assertEqual 2, assertPredicate 1)

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
