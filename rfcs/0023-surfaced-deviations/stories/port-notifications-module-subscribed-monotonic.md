---
title: "Port Notifications.subscribed / monotonic_subscribe / publish_event module methods"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-07-19T01:11:11Z"
assignee: "port-notifications-module-subscribed-monotonic"
blocked-by: null
closed-reason: null
---

## Context

PR #4913 converged `Notifications` onto a `Fanout` notifier, but left three
Rails module-level methods on `ActiveSupport::Notifications` unported. Surfaced
while investigating a wide-call ratchet false-match: trails `Notifications`
(`packages/activesupport/src/notifications.ts`) has `subscribe`/`unsubscribe`/
`instrument`/`publish`/`instrumenter`, but Rails
(`vendor/rails/activesupport/lib/active_support/notifications.rb`) also defines:

- `monotonic_subscribe(pattern, callback, &block)` (notifications.rb:~225) —
  `notifier.subscribe(pattern, callback, monotonic: true, &block)`. trails'
  `Fanout.subscribe` already takes a `monotonic` flag; only the module shortcut
  is missing.
- `subscribed(callback, pattern = nil, monotonic: false, &block)`
  (notifications.rb:~260) — subscribe, yield, `ensure unsubscribe`. Call sites
  (e.g. `packages/activerecord/src/testing/query-assertions.ts`) currently
  inline this subscribe/try-finally/unsubscribe pattern by hand.
- `publish_event(event)` (notifications.rb:~204) — delegates to
  `notifier.publish_event(event)`. trails added `Fanout.publishEvent` in #4913
  but never exposed it on the `Notifications` module.

Note: `NotificationSubscriber` was made an opaque brand in #4913 specifically so
the internal `Fanout` `Subscriber` interface would not leak into the exported
surface. Porting `subscribed` should keep that boundary (do not re-export the
`Fanout` `Subscriber` type).

## Acceptance criteria

- [ ] `Notifications.monotonicSubscribe(pattern, callback)` routes through
      `Fanout.subscribe(..., monotonic = true)`.
- [ ] `Notifications.subscribed(callback, pattern?, { monotonic })` subscribes,
      runs the block, and unsubscribes in a `finally` — mirroring Rails; migrate
      the inlined pattern in `query-assertions.ts` onto it.
- [ ] `Notifications.publishEvent(event)` delegates to `Fanout.publishEvent`.
- [ ] Tests match Rails names; `NotificationSubscriber` stays opaque.
