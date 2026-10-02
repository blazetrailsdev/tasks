---
title: "Port SubscriptionAdapter::SubscriberMap, Base and ChannelPrefix, with the async adapter contract"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-namespace-and-internal-constants"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/subscriber_map.rb` (61 lines), `base.rb` (36) and
`channel_prefix.rb` (30), Tier 1.

**This story fixes the adapter contract for the whole package** (RFC "Async
surface"). The Redis and PostgreSQL adapters do I/O, so `Base#broadcast`,
`#subscribe`, `#unsubscribe` and `#shutdown` (`base.rb:15-29`) are
declared promise-returning here, in the first adapter PR. The Rails bodies are
`raise NotImplementedError`; in trails the promise rejects with it.

- `Base`: `attr_reader :logger, :server`; `initialize(server)` reads
  `@server.logger`; `identifier` (`:31-33`) is
  `@server.config.cable[:id] ||= "ActionCable-PID-#{$$}"`.
- `SubscriberMap`: `@subscribers = Hash.new { |h, k| h[k] = [] }` and a
  `Mutex` (`:8-11`); `add_subscriber` (`:13-25`), `remove_subscriber`
  (`:27-36`), `broadcast` (`:38-47`), and the three hooks subclasses
  override: `add_channel`, `remove_channel`, `invoke_callback`
  (`:49-59`).
- `ChannelPrefix` (`:8-27`), `prepend`ed by the Redis and PostgreSQL
  adapters: each of `broadcast` / `subscribe` / `unsubscribe` rewrites
  `channel` and calls bare `super`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/subscriber_map.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/base.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/channel_prefix.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/subscriber_map_test.rb`:
  - [ ] `broadcast should not change subscribers` (`:6`)

## Fidelity traps (predicted at authoring)

- [ ] **`identifier` writes to the config** (`cable[:id] ||=`). The first call stores the default, and every adapter built from that config then shares it.
- [ ] **`$$` is the process id**: `process.pid` through ruby-compat's process adapter.
- [ ] **`Hash.new { |h, k| h[k] = [] }` stores on read.** `@subscribers[channel]` in `remove_subscriber` creates the key for an unknown channel and then deletes it. `broadcast` guards with `key?` precisely so it does not create one; the Rails test "broadcast should not change subscribers" asserts that.
- [ ] **`broadcast` snapshots the list inside the lock and calls back outside it** (`:39-46`), and its `return` inside the `synchronize` block returns from the method.
- [ ] **`@sync.synchronize` bodies contain no `await`** in the base class; per CLAUDE.md § "The pool monitor guards only sections that span an `await`" they need no lock. Redis's listener re-enters `@sync` from `resubscribe`; keep the field so that body can port.
- [ ] **`add_subscriber`'s `on_success`**: called immediately for an already-known channel, handed to `add_channel` for a new one. The base `add_channel` calls it if present.
- [ ] **Bare `super` in a `prepend`ed module forwards the reassigned local.** `channel = channel_with_prefix(channel); super` passes the prefixed channel. Port with `prepend()` from ruby-compat, passing the rewritten argument explicitly.
- [ ] **`[prefix, channel].compact.join(":")`**: a nil prefix yields the bare channel, with no leading colon.
- [ ] **Callback identity.** `remove_subscriber` deletes by `==` on the Proc. The same function object must be passed to `subscribe` and `unsubscribe`.

## Acceptance criteria

- [ ] All three files read complete in `parity:api`.
- [ ] `Base`'s four methods return promises; the three a subclass must override reject with `NotImplementedError`.
- [ ] `subscriber_map_test.rb`'s case is ported and credited.
- [ ] A `.trails.test.ts` covers `ChannelPrefix` over a recording adapter (with and without a prefix) and `identifier`'s write-back.

## Definition of done

A synchronous `broadcast` on `Base` "until Redis lands" does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/subscription-adapter/subscriber-map.trails.test.ts packages/actioncable/src/subscription-adapter/base.trails.test.ts packages/actioncable/src/subscription-adapter/channel-prefix.trails.test.ts packages/actioncable/src/subscription-adapter/subscriber-map.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
