---
title: "Type Notifications/Fanout subscribe overloads for Rails-shaped callbacks"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8064
claim: "2026-09-24T22:44:14Z"
assignee: "deprecation-silence-and-allow-restore-before-an-async-block-settles"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7894. `packages/activesupport/src/notifications.test.ts` carries ~20 `as never` / `as unknown as EventedListener` casts because `Fanout#subscribe` (`notifications/fanout.ts`) and `Notifications.subscribe` / `subscribed` / `monotonicSubscribe` (`notifications.ts:49-125`) only type the evented/timed/event-object shapes. Rails' `Fanout#subscribe(pattern = nil, callable = nil, monotonic: false, &block)` (`activesupport/lib/active_support/notifications/fanout.rb:64`) and `Subscribers.new` accept a variadic block, a duck-typed object responding to `start`/`finish`/`publish`/`call`, and timed `|name, started, finished, id, payload|` blocks.

## Acceptance criteria

- Type the subscribe overloads to accept the Rails-shaped callbacks; remove the casts from `notifications.test.ts`.
- Same story as `notifications-timed-subscriber-arity-and-event-cpu-allocations` for the arity dispatch; do not duplicate that fix.
