---
title: "lock-thread-has-no-thread-arm-to-select"
status: closed
updated: 2026-09-07
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-07T15:15:55Z"
assignee: "database-config-inspect-prints-adapter-not-adapter-class"
blocked-by: null
closed-reason: "Confirmed permanent: JS has one thread, so Rails' `when Thread` arm of lock_thread= (abstract_adapter.rb:181-192) is unreachable by construction. IsolatedExecutionState has no Thread/Fiber context to discriminate on, and ThreadLoadInterlockAwareMonitor's whole body is Thread.current bookkeeping that collapses to an empty subclass. No code change."
---

## Context

`AbstractAdapter#lock_thread=` has three arms
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:181-192`):
`when Thread` answers `ActiveSupport::Concurrency::ThreadLoadInterlockAwareMonitor`,
`when Fiber` answers `LoadInterlockAwareMonitor`, `else` the `NullLock` constant.

PR #7592 (story `lock-thread-setter-collapses-rails-three-arm-case`) converged the
`else` arm — `setLockThread` now resolves the `NullLock` singleton
(`concurrency/null_lock.rb` is a module that `extend self`, and
`connection_pool_test.rb:906` compares identity against the constant) instead of
constructing one. It could NOT converge the Thread arm, and that is what this
story records.

Two facts block it:

- **trails has no Thread and no Fiber to discriminate on.** Rails'
  `ConnectionPool#pin_connection!` passes `ActiveSupport::IsolatedExecutionState.context`
  (`abstract/connection_pool.rb:335`), which is `Thread.current` or `Fiber.current`
  depending on `isolation_level` (`isolated_execution_state.rb:14-56`). trails'
  `IsolatedExecutionState` (`packages/activesupport/src/isolated-execution-state.ts`)
  has neither `isolationLevel` nor `context`, and
  `ConnectionPool#pinConnectionBang`
  (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:492`)
  passes `executionContextId()` — a number keyed off an AsyncLocalStorage, the
  Fiber analogue. There is no value that could select a Thread arm.
- **`ThreadLoadInterlockAwareMonitor`'s whole body is Thread bookkeeping.**
  `activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:34-63`
  is not a `Monitor` subclass: it keeps `@owner` / `@count` / `@mutex` and
  reimplements `mon_try_enter` / `mon_enter` / `mon_exit` against
  `Thread.current`, so the monitor is reentrant per thread rather than per Fiber.
  With no `Thread.current`, a TS port has nothing to own and collapses to
  `class ThreadLoadInterlockAwareMonitor extends Monitor {}` — byte-identical to
  its sibling, with no caller. #7592 shipped exactly that and removed it again on
  review: an empty subclass with no caller is a stub, not a port.

So `setLockThread` is two arms in trails today, and the missing arm cannot carry
a `@noRailsEquivalent` / `@missingRailsCall` receipt (neither tag covers an
unported case arm) nor a prose comment (`blazetrails/no-freeform-comments`).
This story is the register entry.

## Acceptance criteria

- [ ] Either: trails grows a Thread/Fiber distinction (an
      `IsolatedExecutionState.isolationLevel` + `context` port, and a
      `pinConnectionBang` that passes it), `ThreadLoadInterlockAwareMonitor` is
      ported with its own owner/count/mutex bookkeeping over it, and
      `setLockThread` gets Rails' three arms in Rails' order.
- [ ] Or: the finding is confirmed permanent — JS has one thread, so the Thread
      arm is unreachable by construction — and the story is closed with that
      conclusion recorded, with no code change.
