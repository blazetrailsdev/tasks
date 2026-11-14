---
title: "Action Cable Redis when_connected blocks await the client call"
status: draft
updated: 2026-11-14
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#10083, `packages/actioncable/lib/subscription-adapter/redis.ts` still has two `no-floating-promises` findings:

- `shutdown`'s `when_connected` block: `void this._subscribedClient!.unsubscribe()` (Rails `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb:127-136`, `@subscribed_client.unsubscribe` then `@subscribed_client = nil`).
- `resubscribe`: `void this._subscribedClient!.subscribe(...channels)` (`redis.rb:177-183`).

Both are blocks run through `when_connected` (`redis.rb:161-167`). That method calls `block.call` directly, or the `subscribe` handler drains the queued blocks inside its lock (`redis.rb:99-102`). These blocks are currently synchronous, so they cannot await the client call.

## Acceptance criteria

- [ ] `whenConnected` awaits `block()` when it calls the block inline, and the `subscribe` handler awaits each drained `_whenConnected` block. Both become async up to the already-async callers: `addChannel`, `removeChannel` and `shutdown`'s lock block, which `synchronize` holds until the block settles.
- [ ] The `shutdown` block awaits `unsubscribe()` before nulling `_subscribedClient`, as Rails does. `resubscribe` awaits `subscribe(...channels)`.
- [ ] A test shows `shutdown`'s unsubscribe has completed before `_subscribedClient` is nulled.
- [ ] actioncable's `floating` mark drops by 2.
