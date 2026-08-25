---
title: "Converge SetupAndTeardown's failures list off the module global"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6528
claim: "2026-08-14T16:07:02Z"
assignee: "date-cast-value-rails-branch-structure"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/testing/setup_and_teardown.rb:44-53`
rescues a raising teardown callback and pushes it onto `self.failures` — the
Minitest instance's own failure list, which lives for exactly one test.

trails' port (`packages/activesupport/src/testing/setup-and-teardown.ts`) has
no such receiver: `afterTeardown` is a `this`-typed free function and
`failures` is a module-global array, documented in the port's own JSDoc as a
stand-in. Consequences seen while enrolling the Rails cases in PR #6524:

- Every test that exercises `afterTeardown` must reset `failures.length = 0`
  in a `finally`, or the list leaks across test files in the same worker
  (`after-teardown.test.ts`, `after-teardown-assertion.test.ts`,
  `setup-and-teardown.trails.test.ts` all do this today).
- Concurrent tests in one worker would interleave onto the same list.

## Converged shape

Hold the failure list on the receiver the hooks already take — the same object
`prepended()` installs callbacks on / the `RunningTest` handed to
`tests_without_assertions.rb`'s hook — so `failures` is per-test as in Rails,
and drop the module-global plus the `failures.length = 0` cleanups from the
three test files.

## Acceptance criteria

- [ ] `failures` is per-test state, not a module-global.
- [ ] The three test files above no longer reset a shared list.
- [ ] `setup_and_teardown.rb:44-53`'s two rescue arms are unchanged in behaviour.
