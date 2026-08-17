---
title: "ActiveSupport assert() helpers don't bump the assertion counter, so faithful ports warn as assertion-less"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assert_nothing_raised`, `assert_predicate`, `assert_empty` and every other
ActiveSupport/Minitest assertion helper in
`packages/activesupport/src/testing/assertions.ts` route through the ported
`assert()` (`assertions.ts:517`). In Minitest, `assert` bumps the per-test
counter — `self.assertions += 1` — which is what
`active_support/testing/tests_without_assertions.rb:10-17` reads.

trails wires that counter to **vitest's** expect state instead:

`packages/activesupport/src/test-case.ts:172`

```ts
assertions: expect.getState().assertionCalls ?? 0,
```

`assertionCalls` only counts `expect(...)` invocations, so a test that asserts
exclusively through the ported helpers reads as **zero** assertions and
`afterTeardown` (`tests-without-assertions.ts:32-38`) warns
`Test is missing assertions: ...` on a fully-asserting test.

This is not cosmetic: the warning exists to catch genuinely broken tests, and
it currently fires on precisely the tests that are _most_ Rails-faithful. It
is load-bearing against the port direction — CLAUDE.md and the parity tooling
push ports toward `assertPredicate` over `expect(...).toBe(true)` (a bare
`toBe` normalizes to `equal`, not `predicate`), so every converged file makes
the false-positive population larger.

Observed on the PR #6632 branch: 21 of 41 tests in
`packages/activemodel/src/validations/length-validation.test.ts` warn, plus
tests in `comparison-validation.test.ts`, `conditional-validation.test.ts`,
`presence-validation.test.ts`, `validations.test.ts`, `errors.test.ts`,
`naming.test.ts`, `immutable-string.test.ts` — the warning is already
repo-wide noise, which is how a real zero-assertion test would now go unnoticed.

## Converged shape

Give the ported `assert()` its Minitest side effect: a module-level counter
that `assert()` increments, reset per test by the same hook that builds
`RunningTest`, and summed with vitest's `assertionCalls` at
`test-case.ts:172` so both styles count.

Minitest reference: `assert` increments `self.assertions`; Rails reads it in
`tests_without_assertions.rb`. A `Minitest::Test` receiver has no port here
(see the `@noRailsEquivalent PERMANENT` note on `RunningTest`), so the counter
lives beside `assert()` rather than on a receiver.

## Acceptance criteria

- A test whose only assertions are ActiveSupport helpers does not warn.
- A test with genuinely no assertions still warns (regression test must fail on
  the current baseline).
- The counter resets per test — no leakage across tests in a file.
- `pnpm vitest run packages/activesupport/src/testing/` green, including
  `test-without-assertions.test.ts` and `after-teardown-assertion.test.ts`.

## Re-verified 2026-08-17 (draft sweep)

Still valid, verbatim. `packages/activesupport/src/test-case.ts:172` still reads
`assertions: expect.getState().assertionCalls ?? 0`, so helper-only tests still
read as zero assertions.
