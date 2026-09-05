---
title: "setLockThread collapses Rails' three-arm lock_thread= into two and instantiates NullLock"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while working `abstract-adapter-lock-defaults-to-monitor-not-nulllock`
alongside PR #7527; that story is blocked separately.

Rails' `lock_thread=` has THREE arms
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:181-192`):

```ruby
def lock_thread=(lock_thread) # :nodoc:
  @lock =
  case lock_thread
  when Thread then ActiveSupport::Concurrency::ThreadLoadInterlockAwareMonitor.new
  when Fiber  then ActiveSupport::Concurrency::LoadInterlockAwareMonitor.new
  else             ActiveSupport::Concurrency::NullLock
  end
end
```

trails collapses them into two
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:785-787`):

```ts
setLockThread(lockThread: unknown): void {
  this.lock = lockThread != null ? new LoadInterlockAwareMonitor() : new NullLock();
}
```

Two separate divergences:

- **The Thread arm is missing entirely.** Rails distinguishes a Thread pin
  (`ThreadLoadInterlockAwareMonitor`) from a Fiber pin
  (`LoadInterlockAwareMonitor`); trails answers `LoadInterlockAwareMonitor` for
  both. `ThreadLoadInterlockAwareMonitor` does not exist in trails at all —
  `packages/activesupport/src/concurrency/` has only
  `load-interlock-aware-monitor.ts` (`export class LoadInterlockAwareMonitor
extends Monitor {}`) and `null-lock.ts`. The Rails counterpart is
  `activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb`,
  where `ThreadLoadInterlockAwareMonitor` wraps the monitor in
  `ActiveSupport::Dependencies.interlock.permit_concurrent_loads`.
- **`NullLock` is instantiated where Rails uses the constant.**
  `abstract_adapter.rb:187` is the bare constant
  `ActiveSupport::Concurrency::NullLock` — a module used as a singleton, never
  `.new`. trails builds a fresh `new NullLock()` per call.

The `else`-arm divergence is why the two-arm shape reads as correct today: with
no Thread/Fiber distinction to draw, `lockThread != null` happens to route the
one pinned case to the one monitor trails has.

## Converged shape

Port `ThreadLoadInterlockAwareMonitor` into
`packages/activesupport/src/concurrency/`, then give `setLockThread` the three
arms in Rails' order, with the `else` arm reading a `NullLock` singleton rather
than constructing one. Whether trails has a Thread/Fiber distinction to
discriminate on is the open question the story has to settle first — if it does
not, that is a language-shortcoming finding to record against the Thread arm
specifically, not a licence to keep the collapsed two-arm body.

Related: `abstract-adapter-lock-defaults-to-monitor-not-nulllock` (blocked — the
default-arm half of the same setter), `synchronize-lock-barges-in-the-release-window`,
`converge-acquire-connection-blocking-wait`.

## Acceptance criteria

- [ ] `ThreadLoadInterlockAwareMonitor` exists in
      `packages/activesupport/src/concurrency/`, mirroring
      `activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb`.
- [ ] `setLockThread` has three arms in Rails' order, matching
      `abstract_adapter.rb:181-192`.
- [ ] The `else` arm resolves a `NullLock` singleton, not `new NullLock()`.
- [ ] `pnpm parity:api:calls` / `:calls:args` clean, no baseline row added.
