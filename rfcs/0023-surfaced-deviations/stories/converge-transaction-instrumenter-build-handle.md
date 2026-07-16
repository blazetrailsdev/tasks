---
title: "TransactionInstrumenter uses build_handle for a transaction-spanning event"
status: claimed
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-16T15:51:11Z"
assignee: "converge-transaction-instrumenter-build-handle"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TransactionInstrumenter`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:90-107`)
spans the transaction with a **handle**:

```ruby
@payload = @base_payload.dup
@handle = ActiveSupport::Notifications.instrumenter.build_handle("transaction.active_record", @payload)
@handle.start
# ... later ...
@payload[:outcome] = outcome
@handle.finish
```

The one handle-backed event carries the transaction's real span: `event.duration`
covers `start`→`finish`, and subscribers see a single event with the correct
transaction id/timing.

trails' `TransactionInstrumenter`
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts:163-199`)
diverges: it builds a `NotificationEvent` at `start()` but never starts it through
the notifier, and at `finish()` calls
`Notifications.publish("transaction.active_record", { ...this._payload, duration })`,
which builds a **fresh** event at publish time. The published event's real timing
is the publish call; the true duration is only stuffed into the payload. The old
code comment already acknowledged this ("Ideally we'd publish the Event instance
directly (like Rails' handle.finish), but Notifications.publish creates a new
Event"). Surfaced by Codex review of #4903.

Blocked on the missing primitive: trails' `Instrumenter` has no `build_handle`
(Rails' `instrumenter.rb:78-80`), and the static `Notifications` singleton exposes
no `instrumenter` accessor / `buildHandle`. #4903 introduced an internal `Handle`
(builds the Event at finish, off the mutated payload) that is the natural backing
for a real `build_handle` — this story should expose it.

## Acceptance criteria

- [ ] Add `Instrumenter#build_handle(name, payload)` returning a handle with
      `start()` / `finish()`, mirroring Rails (`instrumenter.rb:78-80`,
      `fanout.rb` Handle). Thread the published event through the notifier so a
      single handle-backed event carries the transaction span.
- [ ] Expose the static analogue (`Notifications.instrumenter` /
      `Notifications.buildHandle`) that Rails reaches via
      `ActiveSupport::Notifications.instrumenter.build_handle`.
- [ ] Rewire `TransactionInstrumenter#start`/`#finish` to use the handle instead
      of building a `NotificationEvent` + `Notifications.publish`. Drop the
      `duration`-in-payload workaround; `event.duration` must cover the
      transaction, not the publish call.
- [ ] `transaction-instrumentation.test.ts` keeps passing (outcome, duration,
      commit/rollback/savepoint span).
- [ ] api:compare / test:compare delta non-negative.
