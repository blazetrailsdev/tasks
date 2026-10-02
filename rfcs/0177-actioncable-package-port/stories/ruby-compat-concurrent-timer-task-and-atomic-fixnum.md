---
title: "ruby-compat: Concurrent::TimerTask and Concurrent::AtomicFixnum"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two concurrent-ruby classes Action Cable's lib calls and ruby-compat does not
have (`grep -rn "TimerTask\|AtomicFixnum" packages` is empty):

- `Concurrent::TimerTask.new(execution_interval: interval, &block).tap(&:execute)`
  (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb:20`). The returned task is what
  `Server::Connections#setup_heartbeat_timer` memoizes
  (`server/connections.rb:34`) and what
  `Channel::PeriodicTimers#stop_periodic_timers` calls `shutdown` on
  (`channel/periodic_timers.rb:73`).
- `Concurrent::AtomicFixnum.new(1)` with `increment`, `decrement` and
  `value` (`channel/base.rb:164,240,245,249`), the deferred-confirmation
  counter.

Both go beside `ThreadPoolExecutor` in ruby-compat with the package's
`@noRailsEquivalent PERMANENT` receipt and a README row.
`0169/port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`
(draft) adds `ScheduledTask`, a one-shot; `TimerTask` repeats. They are
different classes and neither story covers the other.

## Fidelity traps (predicted at authoring)

- [ ] **`execution_interval` is in seconds** and may be fractional. `setInterval` takes milliseconds.
- [ ] **The first run is after one interval**, not immediately (concurrent-ruby's `run_now` defaults to false). A heartbeat sent at time zero changes what `client_test.rb` counts.
- [ ] **The timer must not hold the process open.** `unref` it, or every test that builds a server hangs at exit.
- [ ] **A raising block does not stop the timer.** concurrent-ruby reports the error to observers and schedules the next run.
- [ ] **An async block.** The block here posts to an executor and returns. If a block returns a promise, the next interval must not start a second overlapping run while the first is pending; concurrent-ruby schedules the next run after the previous one finishes.
- [ ] **`shutdown` is idempotent** and cancels the pending run.
- [ ] **`AtomicFixnum#decrement` returns the new value**; `value` reads it. The counter starts at 1 and `defer_subscription_confirmation?` is `value > 0`.

## Acceptance criteria

- [ ] `TimerTask` (`execute`, `shutdown`, `executionInterval`) and `AtomicFixnum` (`increment`, `decrement`, `value`) exist in ruby-compat with receipts, README rows and tests.
- [ ] A `TimerTask` at 0.05s runs repeatedly after the first interval and never again after `shutdown`.
- [ ] `pnpm parity:api:extra:gate` is green.

## Definition of done

A bare `setInterval` in `stream-event-loop.ts`, or a plain number field for the confirmation counter, does not close this story.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src -t 'TimerTask|AtomicFixnum'
pnpm parity:api:extra:gate
```
