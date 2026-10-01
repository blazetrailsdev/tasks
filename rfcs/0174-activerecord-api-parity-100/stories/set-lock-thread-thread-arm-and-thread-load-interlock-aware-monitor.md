---
title: "set-lock-thread-thread-arm-and-thread-load-interlock-aware-monitor"
status: ready
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:deps` is at 0 ✗ and 0 ref mismatches for activerecord → arel and → activemodel, and at
0 ✗ / 1 ref mismatch for → activesupport. The one row left is

```text
≠ setLockThread -- missing ThreadLoadInterlockAwareMonitor  (connection-adapters/abstract-adapter.ts)
```

Rails' `lock_thread=` has three arms
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:181-191`):
`when Thread` → `ActiveSupport::Concurrency::ThreadLoadInterlockAwareMonitor.new`, `when Fiber` →
`LoadInterlockAwareMonitor.new`, `else` → `NullLock`. trails' `setLockThread`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:954-956`) has two:
`lockThread != null ? new LoadInterlockAwareMonitor() : NullLock`.

`lock-thread-has-no-thread-arm-to-select` (RFC 0119) closed this as permanent on the premise that
"IsolatedExecutionState has no Thread/Fiber context to discriminate on". That premise no longer holds:

- `@blazetrails/ruby-compat` exports `Thread` and `Fiber` classes (`packages/ruby-compat/src/thread.ts`).
- `IsolatedExecutionState.context()` answers one of them, selected by `isolationLevel`
  (`packages/activesupport/src/isolated-execution-state.ts`, port of `isolated_execution_state.rb:14-56`).
- `ConnectionPool#pinConnectionBang` already passes it:
  `this._pinnedConnection.setLockThread(IsolatedExecutionState.context())`
  (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:364`, Rails `connection_pool.rb:335`).

So `lockThread instanceof Thread` / `instanceof Fiber` can now select Rails' arms.

What is still open is the monitor itself. `ThreadLoadInterlockAwareMonitor`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:36-68`) is
`@owner` / `@count` / `@mutex` bookkeeping against `Thread.current`, reentrant per THREAD. CLAUDE.md
§ "The adapter lock defaults to a monitor, not `NullLock`" records why a per-context owner is not enough in
JS: sibling promises under one async context would all re-enter at once. A port has to keep that
serialization (ruby-compat's `synchronize` runs each entry under an owner of its own) while carrying Rails'
class name and `mon_try_enter` / `mon_enter` / `mon_exit` members. #7592 shipped an empty
`class ThreadLoadInterlockAwareMonitor extends Monitor {}` and removed it on review as a stub; do not repeat
that.

`ActiveSupport::Dependencies.interlock.permit_concurrent_loads` in the mixin's `mon_enter`
(`load_interlock_aware_monitor.rb:13-16`) stays unported: SKIP_GROUPS in `scripts/parity/conventions.ts`
scopes `dependencies/interlock.rb` out, and `lint-deps.ts`'s `RUBY_UNPORTED_REFS` mirrors that.

## Acceptance criteria

- [ ] `ThreadLoadInterlockAwareMonitor` is ported into `packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts`
      with Rails' members, and still serializes sibling promises started under one holder
      (a regression test with `Promise.all` inside a pinned connection's transaction fails without it).
- [ ] `setLockThread` has Rails' three arms in Rails' order (`abstract_adapter.rb:181-191`), discriminating on
      ruby-compat's `Thread` / `Fiber`.
- [ ] `pnpm parity:api:deps` shows 0 ref mismatches for activerecord → activesupport.
- [ ] If the Thread arm genuinely cannot hold the serialization guarantee, `pnpm tasks block` this with that
      specific finding rather than closing it.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:deps
```
