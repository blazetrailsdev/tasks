---
title: "port Notifications.subscribed and delete the invented collectEvents"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6468
claim: "2026-08-13T15:19:07Z"
assignee: "merge-clauses-where-clause-structure"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Notifications.collect_events` does not exist in Rails. trails
carries `Notifications.collectEvents` / `collectEventsAsync`
(`packages/activesupport/src/notifications.ts:287`, `:298`) as a
subscribe-run-unsubscribe wrapper, and its own JSDoc claims it "mirrors Rails'
AS::Notifications test helpers" — it does not. Rails' equivalent is
`ActiveSupport::Notifications.subscribed(callback, pattern, monotonic:, &block)`
(`activesupport/lib/active_support/notifications.rb:258`), which subscribes for
the duration of the block and unsubscribes in an `ensure`.

Rails' cache tests reach for it directly:
`cache_instrumentation_behavior.rb`'s private `with_instrumentation` builds the
array itself around a bare `subscribe`/`unsubscribe` pair, and
`test_fetch_multi_instrumentation_order_of_operations`
(cache_instrumentation_behavior.rb:37) calls
`ActiveSupport::Notifications.subscribed(callback, /…/) { }`.

PR #6453 ported that module into
`packages/activesupport/src/cache/behaviors/cache-instrumentation-behavior.ts`
and had to spell `with_instrumentation` on top of `collectEvents`, so the
invented helper is now load-bearing for a ported Rails test body.

## Converged shape

Port `Notifications.subscribed` at the Rails name and signature, rewrite
`cache-instrumentation-behavior.ts`'s `withInstrumentation` as Rails writes it
(subscribe, yield, unsubscribe in a `finally`), point the remaining
`collectEvents` callers at `subscribed`, and delete `collectEvents` /
`collectEventsAsync`.

`pnpm parity:api:extra --package activesupport` should lose both names.

## Acceptance criteria

- [ ] `Notifications.subscribed` exists with Rails' parameter order and the
      `monotonic:` kwarg.
- [ ] `collectEvents` and `collectEventsAsync` are gone, not merely deprecated.
- [ ] `cache-instrumentation-behavior.ts`'s `withInstrumentation` reads like
      cache_instrumentation_behavior.rb's private method.
