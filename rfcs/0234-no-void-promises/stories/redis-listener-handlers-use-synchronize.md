---
title: "Action Cable Redis listener handlers use synchronize, not lock/unlock"
status: in-progress
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#10199
claim: "2026-11-16T18:37:11Z"
assignee: "action-text-content-built-with-awaited-static-new"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Listener#listen` takes `@subscription_lock.synchronize` in the `on.subscribe` and `on.unsubscribe` callbacks (`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb:99-121`). Ruby runs those callbacks on the listener thread. trails#10098 spells them as `lock()` / `unlock()` in a `finally`, with an `@inventedArm lock|unlock — PERMANENT` receipt on `listen` (`packages/actioncable/lib/subscription-adapter/redis.ts`).

The cause is in the `redisConnector` default. Its wrapper emits the synthesized `subscribe` / `unsubscribe` event inside the caller's async context, and that caller is a `whenConnected` block awaiting `subscribe` / `unsubscribe` while it holds the lock. In that context ruby-compat's `synchronize` sees the same fiber and raises "deadlock; recursive locking", where `lock()` waits for the holder.

## Acceptance criteria

- [ ] The connector delivers subscribe/unsubscribe confirmations outside the caller's lock context, for example from the listener `Thread`'s own context, so both handlers use `this._subscriptionLock.synchronize` as Rails does.
- [ ] The `@inventedArm lock` and `@inventedArm unlock` receipts are deleted.
- [ ] The Action Cable Redis CI lane stays green.
