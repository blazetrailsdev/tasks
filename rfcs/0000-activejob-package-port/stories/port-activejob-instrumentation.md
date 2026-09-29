---
title: "Port ActiveJob::Instrumentation and ActiveJob.instrument_enqueue_all"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "activesupport"]
deps: ["port-activejob-callbacks"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/instrumentation.rb` (52 lines): private singleton
`ActiveJob.instrument_enqueue_all(queue_adapter, jobs)` (`:4-14`), which stamps
`enqueued_count` from the block's result; `Instrumentation`'s `around_enqueue`
choosing `:enqueue_at` or `:enqueue` (`:19-23`); `perform_now` wrapping
`instrument(:perform) { super }` (`:25-27`); `_perform_job` emitting
`:perform_start` then `super` (`:30-33`); private `instrument` (`:35-45`);
`halted_callback_hook` calling `super` and setting
`@_halted_callback_hook_called` (`:47-50`).

`Base` gains `include Instrumentation` (`base.rb:72`). RFC 0116's
`jobruntime-instrument-drops-both-super-delegations` depends on this story: its
`super` is this `instrument`.

The Rails coverage (`instrumentation_test.rb`) needs `retry_on` and lands with
`port-activejob-rescue-and-instrumentation-tests`.

## Fidelity traps (predicted at authoring)

- [ ] **`Notifications.instrument` with an async block.** Check that activesupport's `instrument` finishes the event (and records `exception_object`) when the block's promise settles; converge it here if it does not.
- [ ] **`payload[:aborted] = @_halted_callback_hook_called if defined?(@_halted_callback_hook_called)`** (`:41`): the key is set only when the ivar was ever assigned — `defined?` on an ivar, not truthiness. Then it is reset to `nil` (`:42`).
- [ ] **`halted_callback_hook(*)`** is activesupport's hook (`packages/activesupport/src/callbacks.ts:405`); the override must call `super`.
- [ ] **`scheduled_at ? … : …`** (`:21`) is Ruby truthiness.
- [ ] **`payload[:adapter] = queue_adapter`** reads the class's adapter at event time.

## Acceptance criteria

- [ ] `instrumentation.rb` reads complete in `parity:api`.
- [ ] `perform_now` and `_perform_job` reach `Execution`'s through real `super` (module linearization via `include()`); `pnpm parity:api:calls` shows no new rows.
- [ ] A `perform.active_job` event's duration covers an awaited `perform` body.

## Definition of done

Folding `Instrumentation#perform_now` into `Execution#perform_now`, or finishing the event before the awaited body, does not close this story.
