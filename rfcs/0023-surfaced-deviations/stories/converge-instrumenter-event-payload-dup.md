---
title: "converge-instrumenter-event-payload-dup"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T19:21:10Z"
assignee: "converge-instrumenter-event-payload-dup"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Instrumenter#instrument`
(`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:56-67`)
never constructs an `Event`. It calls `build_handle(name, payload)` and hands the
**raw payload** to the Fanout handle, which passes that same object to
subscribers via `start`/`finish` (`fanout.rb:233,245,250`). That reference
sharing is load-bearing: it is how `payload[:exception]` /
`payload[:exception_object]`, set in the rescue arm, become visible to
subscribers such as `ExplainSubscriber`.

trails' `Instrumenter` instead builds an `Event`
(`packages/activesupport/src/notifications/instrumenter.ts:_push`) and publishes
that. It currently reproduces the Rails semantic only by accident: trails'
`Event` (`instrumenter.ts:14-32`) holds the payload **by reference**, whereas
Rails' `Event#initialize` does `@payload = payload.dup` (`instrumenter.rb:105`).

So two divergences cancel out. Converging `Event` to Rails' `.dup` in isolation
would silently break subscriber visibility of the exception keys — surfaced in
review of #4894, where the `_push` comment documents the coupling.

Rails' `.dup` is on the `new_event` / `Event#record` path
(`instrumenter.rb:132-143`), which trails does not implement at all — trails'
`Event` has no `record`.

## Acceptance criteria

- [ ] Route `Instrumenter#instrument` / `#instrumentAsync` through a handle that
      carries the raw payload, as Rails does, rather than through an `Event`.
- [ ] Once that path no longer depends on the shared reference, converge
      `Event#initialize` to Rails' `@payload = payload.dup`.
- [ ] Subscribers still observe `payload.exception` / `payload.exception_object`
      set by the rescue arm — the tests in
      `notifications/instrumenter.trails.test.ts` must keep passing.
- [ ] Remove the `_push` comment in `instrumenter.ts` documenting the coupling
      once it no longer applies.
- [ ] Decide whether `Event#record` + `new_event` should be ported, since Rails'
      `.dup` semantics only matter on that path.
