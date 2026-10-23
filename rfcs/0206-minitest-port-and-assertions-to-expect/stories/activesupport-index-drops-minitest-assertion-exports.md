---
title: "Delete the Minitest assertion helpers; test code cannot import them"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: expect-sweeps
packages: [activesupport]
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
    ported-rails-assertion-bodies-call-expect,
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

Close-out of the RFC. By owner ruling (2026-10-23) Minitest is reference only
(`vendor/minitest/v5.27.0/`), not ported. After every `expect-sweep-*` story
and `ported-rails-assertion-bodies-call-expect`, nothing in the repo calls the
Minitest half of `packages/activesupport/src/testing/assertions.ts`
(`:540-1016`, `assertEqual`, `assertNil`, `assertPredicate`, `message`,
`diff`, …), and `packages/activesupport/src/index.ts` (around `:598-639`)
still re-exports it. This story deletes it. It supersedes RFC 0158's
`delete-minitest-builtin-assert-helpers`.

Baseline (2026-10-22, trails `1b769d8daa`): 5,938 import-resolved call sites
in 392 test files; `pnpm parity:api:extra --package activesupport` total 764,
24 of them in `testing/assertions.ts`.

## Acceptance criteria

- [ ] The Minitest assertion helpers are deleted from
      `packages/activesupport/src/testing/assertions.ts`, not moved.
      The file exports exactly `assertNot`, `assertRaises`, `assertRaise`,
      `assertNothingRaised`, `assertDifference`, `assertNoDifference`,
      `assertChanges`, `assertNoChanges`, `_assertNothingRaisedOrWarn`,
      `_callableToSourceString` and `UNTRACKED`, plus whatever the runner and
      mock classes still need until their own stories settle them (RFC Open
      question 1), and carries no `@noRailsEquivalent PERMANENT` tag on an
      assertion helper.
- [ ] The activesupport index re-exports no Minitest assertion name. The
      `TestCase` statics for Rails' `assert_not_*` aliases
      (`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:164-296`)
      that alias a Minitest assert are removed with it; aliases of Rails'
      own assertions stay.
- [ ] An ESLint `no-restricted-imports` / `no-restricted-syntax` entry forbids
      defining or importing a Minitest assertion helper name (`assertEqual`,
      `assertNil`, `assertPredicate`, …) anywhere under `packages/*/src`, so the
      tree cannot regress. Rails' `ActiveSupport::Testing::Assertions` names stay
      allowed.
- [ ] Every `toBeInstanceOf` port of a Rails `assert_instance_of` is
      `toBeExactInstanceOf`, and `kindOf: "instanceOf"` is deleted from
      `HISTOGRAM_FOLD` in `scripts/test-compare/assertion-kinds.ts`, with
      `pnpm parity:test:assertions` green (carried over from 0158's story).
- [ ] The RFC's import-resolved count reads 0; the PR body records the
      activesupport `parity:api:extra` total before and after.
