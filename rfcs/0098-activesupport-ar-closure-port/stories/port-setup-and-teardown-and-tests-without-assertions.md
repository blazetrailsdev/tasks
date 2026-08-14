---
title: "Port SetupAndTeardown and TestsWithoutAssertions into the TestCase receiver"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6516
claim: "2026-08-14T12:07:07Z"
assignee: "read-association-scope-off-reflection-not-definition-bag"
blocked-by: null
closed-reason: null
---

## Context

PR #6510 ported `ActiveSupport::TestCase`
(`packages/activesupport/src/test-case.ts`, mirroring
`activesupport/lib/active_support/test_case.rb`), so the include list at
`test_case.rb:144-153` is now written down once and the two modules Rails
`prepend`s there have a receiver to attach to. They are still unported:

- `activesupport/lib/active_support/testing/setup_and_teardown.rb` —
  `parity:api` reports `testing/setup-and-teardown.ts  0/5  0%`
  (`prepend`ed at `test_case.rb:145`). Its `before_setup` / `after_teardown` /
  `run` wrap each test in the `ActiveSupport::Callbacks` `:setup` / `:teardown`
  chains, which is what makes `setup`/`teardown` declarations composable across
  a test-case hierarchy.
- `activesupport/lib/active_support/testing/tests_without_assertions.rb` —
  `testing/tests-without-assertions.ts  0/1  0%` (`prepend`ed at
  `test_case.rb:146`); its `run` warns on a test that made no assertion.

## Converged shape

Port both files under their Rails paths and add them to `test-case.ts`'s
include list in Rails' order, immediately after the TaggedLogging block
(test_case.rb:144-146). Ruby's `prepend` puts them AHEAD of the class's own
methods in the ancestor chain; the trails receiver expresses the list as
assignments, so the ordering that matters is the hook-installation order at the
bottom of `test-case.ts`.

## Acceptance criteria

- [ ] `testing/setup-and-teardown.ts` and `testing/tests-without-assertions.ts`
      exist and their `parity:api` rows move off 0%.
- [ ] `test-case.ts` carries both, at `test_case.rb:145-146`'s position.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
