---
title: "Enroll the after_teardown and tests-without-assertions Rails test cases"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6524
claim: "2026-08-14T14:47:03Z"
assignee: "deprecation-raise-behavior-raises-deprecationexception"
blocked-by: null
closed-reason: null
---

## Context

PR #6516 ported `activesupport/lib/active_support/testing/setup_and_teardown.rb`
and `tests_without_assertions.rb` (both 100% on `parity:api`) and prepended them
to the `TestCase` receiver, but left their Rails test files as PERMANENT-SKIP
stubs:

- `packages/activesupport/src/testing/after-teardown.test.ts` — Rails'
  `activesupport/test/testing/after_teardown_test.rb`, `AfterTeardownTest`
  "teardown raise but all after teardown method are called", which is the test
  for `setup_and_teardown.rb:44-53`'s rescue arms (a raising teardown is
  recorded on `self.failures`, and the rest of the `after_teardown` chain still
  runs).
- `packages/activesupport/src/testing/after-teardown-assertion.test.ts` — the
  `Minitest::Assertion` arm of the same rescue.
- `packages/activesupport/src/testing/test-without-assertions.test.ts` — Rails'
  "without assertions", the test for `tests_without_assertions.rb:10-17`.

The behaviour they cover IS implemented and is covered by trails-only tests in
`packages/activesupport/src/testing/setup-and-teardown.trails.test.ts`, so this
is a test-parity gap, not a port gap: the Rails-named tests still score 0.

## Converged shape

Enroll the three files against the ported modules, keeping each Rails test name
verbatim (the stubs already hold them). Rails drives these through a
`Minitest::Test` subclass and inspects `failures` after the run; the trails
equivalent drives `TestCase.afterTeardown` / the module functions directly, as
the trails test file already does.

Note the enrollment cost: a `test:compare` enrollment is four registrations, and
the assertion-mismatch mark can red CI with a fully green local compare (see
CONTRIBUTING.md and the `parity:test` docs).

## Acceptance criteria

- The three files above are enrolled and passing, with Rails' test names
  unchanged.
- `pnpm parity:test --package activesupport` numerator rises by those tests and
  the assertion mark does not rise.
