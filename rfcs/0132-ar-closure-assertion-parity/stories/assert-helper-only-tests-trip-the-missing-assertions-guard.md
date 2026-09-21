---
title: "Helper-only tests trip vitest's missing-assertions guard"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

vitest's expect-count guard logs `Test is missing assertions: <name>` for any test
that never calls a vitest `expect`. RFC 0132 converges Rails assertions onto trails
`assert*` helpers (`assertRaises`, `assertNothingRaised`, `assertEmpty`, `assertCalled`,
…), and a test whose assertions are ALL helper calls therefore trips the guard even
though it is fully asserted.

Observed on trails#7909 (stderr, non-failing):

- `packages/activerecord/src/adapter.test.ts` — `remove index when name and wrong
column name specified`, `remove index when name and wrong column name specified
positional argument`, `disable referential integrity`
- `packages/activerecord/src/transactions.test.ts` — `transaction rollback with
primarykeyless tables`

The warning is harmless today but it is exactly backwards: it fires on the tests that
have been converged and stays silent on the ones that have not, so the signal that a
test genuinely asserts nothing is buried. The campaign converts more tests to
helper-only assertions every PR, so the noise only grows.

The helpers all funnel through `assert()` in
`packages/activesupport/src/testing/assertions.ts:341`, which is the seam a fix can
hook — either by calling a vitest `expect` inside `assert()`, or by teaching the
harness guard to count helper invocations the way `isAssertionCallee` in
`scripts/test-compare/extract-ts-core.ts` already does
(`/^(assert|refute|expect)([A-Z]|$)/`).

## Acceptance criteria

- A test whose assertions are all trails `assert*` helpers no longer logs
  `Test is missing assertions`.
- A test that genuinely asserts nothing still does.
- No test is given a filler `expect` to silence the guard.
