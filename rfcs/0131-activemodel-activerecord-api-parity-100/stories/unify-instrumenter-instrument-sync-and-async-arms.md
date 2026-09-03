---
title: "Unify Instrumenter#instrument with its async twin so EventBuffer can take the Rails name"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Notifications::Instrumenter#instrument`
(`activesupport/lib/active_support/notifications/instrumenter.rb:54-65`) is ONE
Ruby method:

```ruby
def instrument(name, payload = {})
  handle = build_handle(name, payload)
  handle.start
  begin
    yield payload if block_given?
  rescue Exception => e
    payload[:exception] = [e.class.name, e.message]
    payload[:exception_object] = e
    raise e
  ensure
    handle.finish
  end
end
```

trails splits it into `instrument` (sync) plus an `instrumentAsync` twin
(`packages/activesupport/src/notifications/instrumenter.ts:226-259`), because a
JS body cannot await without becoming async.

That split is load-bearing well beyond activesupport. `AbstractAdapter#log`
reaches its instrumenter through the duck-typed `AdapterInstrumenter` contract
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:29-35`,
called at `:2019`), whose two implementations are `Notifications.instrumenter`
— an `Instrumenter`, which already spells Rails' SYNC `instrument` at that name
— and `FutureResult::EventBuffer`. Rails' `EventBuffer#instrument`
(`activerecord/lib/active_record/future_result.rb:33-40`) therefore cannot take
its Rails name in trails: renaming only `EventBuffer`'s member breaks the
contract, and adding `instrument` beside `instrumentAsync` is an invented
synonym. This is why `converge-future-result-event-buffer-instrument` is
blocked and `future_result.rb` sits at 15/16.

## Converged shape

Make `Instrumenter#instrument` a SINGLE non-async method at the Rails name,
returning `T | Promise<T>`: build the handle, start it, call the block, and when
the block's result is a thenable finish the handle in a `then`/`finally` rather
than the synchronous `finally` — the settled trails idiom for a Ruby body whose
one control flow must cover both (compare the non-async `Promise<void> | void`
seats already in the repo). The `rescue Exception` arm's
`_recordException(payload, e)` must run on both arms.

Then `instrumentAsync` disappears from `Instrumenter`,
`Notifications.instrumentAsync` (`notifications.ts:245-265`, itself a
`@noRailsEquivalent` trails extension and NOT in scope to remove) delegates to
the unified `instrument`, the `AdapterInstrumenter` contract member becomes
`instrument`, and `EventBuffer` takes its Rails name — unblocking
`converge-future-result-event-buffer-instrument`.

`Event#record` / `recordAsync` (`instrumenter.ts:51-81`) is the same split one
level down and should be assessed the same way in this story; its
`@noRailsEquivalent PERMANENT` receipt is a burndown row, not a settled
decision.

## Acceptance criteria

- `Instrumenter#instrument` is one method at the Rails name covering a sync and
  an awaited block; no `instrumentAsync` remains on `Instrumenter`.
- The `AdapterInstrumenter` contract names `instrument`, and
  `EventBuffer#instrument` is a real body at the Rails name — `future_result.rb`
  reaches 16/16.
- Every `sql.active_record` event still carries `exception` /
  `exception_object` on a raising block, on both arms.
- `pnpm parity:api:calls`, `:calls:args` and `:params` clean; no baseline row
  added, no mark raised.

## Notes

Discovered while blocking `converge-future-result-event-buffer-instrument` in
PR #7446. That story stays blocked until this lands.
