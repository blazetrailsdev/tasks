---
title: "activesupport stops exporting the Minitest assertions, and test code cannot import them"
status: draft
updated: 2026-10-22
rfc: "0000-minitest-port-and-assertions-to-expect"
cluster: minitest-package
packages: [activesupport, minitest]
deps:
  [
    expect-sweep-actionpack-10,
    expect-sweep-actionpack-1,
    expect-sweep-actionpack-2,
    expect-sweep-actionpack-3,
    expect-sweep-actionpack-4,
    expect-sweep-actionpack-5,
    expect-sweep-actionpack-6,
    expect-sweep-actionpack-7,
    expect-sweep-actionpack-8,
    expect-sweep-actionpack-9,
    expect-sweep-actionview-1,
    expect-sweep-actionview-2,
    expect-sweep-activejob,
    expect-sweep-activemodel-1,
    expect-sweep-activemodel-2,
    expect-sweep-activerecord-1,
    expect-sweep-activerecord-2,
    expect-sweep-activerecord-3,
    expect-sweep-activerecord-4,
    expect-sweep-activerecord-5,
    expect-sweep-activesupport-1,
    expect-sweep-activesupport-2,
    expect-sweep-gem-packages,
    expect-sweep-trailties,
    ported-rails-assertion-modules-import-minitest,
    minitest-package-ports-runner-classes,
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Close-out of the RFC. After every `expect-sweep-*` story and
`ported-rails-assertion-modules-import-minitest`, no test file calls a Minitest
assertion and every ported Rails module imports one from
`@blazetrails/minitest`. `packages/activesupport/src/index.ts` (around
`:598-639`) still re-exports the moved names. This supersedes RFC 0158's
`delete-minitest-builtin-assert-helpers`, which proposed deleting the helpers
outright; ported Rails bodies call them, so they move instead.

Baseline (2026-10-22, trails `1b769d8daa`): 5,938 import-resolved call sites
in 392 test files; `pnpm parity:api:extra --package activesupport` total 764,
24 of them in `testing/assertions.ts`.

## Acceptance criteria

- [ ] `packages/activesupport/src/testing/assertions.ts` exports exactly
      `assertNot`, `assertRaises`, `assertRaise`, `assertNothingRaised`,
      `assertDifference`, `assertNoDifference`, `assertChanges`,
      `assertNoChanges`, `_assertNothingRaisedOrWarn`,
      `_callableToSourceString` and `UNTRACKED`, and has no
      `@noRailsEquivalent PERMANENT` tag.
- [ ] The activesupport index re-exports no Minitest name. The `TestCase`
      statics for Rails' `assert_not_*` aliases
      (`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:164-296`)
      stay, pointing at `@blazetrails/minitest`.
- [ ] An ESLint `no-restricted-imports` entry for `**/*.test.ts` forbids
      importing the Minitest assertion names from `@blazetrails/minitest` or
      `@blazetrails/activesupport` (Rails' `ActiveSupport::Testing::Assertions`
      names, `stub` and `assertMock` stay allowed), so the tree cannot regress.
- [ ] Every `toBeInstanceOf` port of a Rails `assert_instance_of` is
      `toBeExactInstanceOf`, and `kindOf: "instanceOf"` is deleted from
      `HISTOGRAM_FOLD` in `scripts/test-compare/assertion-kinds.ts`, with
      `pnpm parity:test:assertions` green (carried over from 0158's story).
- [ ] The RFC's import-resolved count reads 0; the PR body records the
      activesupport `parity:api:extra` total before and after (expected 739).
