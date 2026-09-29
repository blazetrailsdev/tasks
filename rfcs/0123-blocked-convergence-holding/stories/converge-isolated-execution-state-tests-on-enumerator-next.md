---
title: "Converge IsolatedExecutionState tests on Enumerator#next"
status: blocked
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-22T16:05:43Z"
assignee: "converge-isolated-execution-state-tests-on-enumerator-next"
blocked-by: "Re-verified 2026-09-29: ruby-compat now has an Enumerator (packages/ruby-compat/src/enumerator.ts, via trails#8063) but only the to_enum shape (constructor(obj, meth, args) + each) — no block-form constructor, no yielder, no #next, and nothing resumes a Fiber. port-a-minimal-enumerator-for-to-enum-arms (RFC 0023) is still draft. Unblock when Enumerator#next runs its block on a ruby-compat Fiber."
closed-reason: null
---

## Context

`#[] when isolation level is :fiber` and `#[] when isolation level is :thread`
(`vendor/rails/activesupport/test/isolated_execution_state_test.rb:16-40`) read the
state from inside `Enumerator.new { |y| y.yield ... }.next`. `Enumerator#next` runs
the block on a new Fiber. ruby-compat has no `Enumerator` (and `Fiber` has no
`Fiber.yield`), so trails#7818 ported the `:fiber` test as
`new Fiber(() => ...).resume()` in
`packages/activesupport/src/isolated-execution-state.test.ts`, and the `:thread`
test drops the enumerator assertion.

Depends on `port-a-minimal-enumerator-for-to-enum-arms` (0023) landing an
`Enumerator` whose `next` resumes a ruby-compat `Fiber`.

## Acceptance criteria

- [ ] Both tests build `new Enumerator((yielder) => yielder.yield(IsolatedExecutionState.get("test")))` and assert on `enumerator.next()` exactly as Rails does (`nil` under `:fiber`, `42` under `:thread`).
- [ ] `Enumerator#next` runs its block on a `Fiber` (`vendor/ruby/enumerator.c` `next_i` via `rb_fiber_new`), so `Fiber.current()` differs inside it.
