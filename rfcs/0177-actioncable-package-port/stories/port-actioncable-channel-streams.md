---
title: "Port Channel::Streams"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-channel-naming-and-broadcasting",
    "port-actioncable-channel-callbacks-and-periodic-timers",
    "port-actioncable-subscriber-map-base-adapter-and-channel-prefix",
  ]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/streams.rb` (215 lines, about 100 of code), Tier 1. Rails'
`channel/stream_test.rb` is ported in `port-actioncable-channel-stream-test`.

- `included do on_unsubscribe :stop_all_streams end` (`:80-82`).
- `stream_from(broadcasting, callback = nil, coder: nil, &block)`
  (`:90-107`): `String(broadcasting)`, `defer_subscription_confirmation!`,
  build the handler, store it in `streams`, then
  `connection.server.event_loop.post { pubsub.subscribe(broadcasting, handler,
lambda { ensure_confirmation_sent; logger.info … }) }`.
- `stream_for(model, callback = nil, coder: nil, &block)` (`:116-118`).
- `stop_stream_from`, `stop_stream_for`, `stop_all_streams`
  (`:121-140`), `stream_or_reject_for` (`:144-150`).
- Private: `delegate :pubsub, to: :connection`, `streams`,
  `worker_pool_stream_handler`, `stream_handler`,
  `default_stream_handler`, `stream_decoder`, `stream_transmitter`,
  `identity_handler` (`:153-212`).

**Async (RFC "Async surface").** `stream_from` and `stream_for` stay
synchronous: Rails already posts the subscribe to the event loop and reports
completion through the success callback. The posted task awaits
`pubsub.subscribe`. `stop_stream_from`, `stop_stream_for` and
`stop_all_streams` call `pubsub.unsubscribe` directly in Rails, so in trails
they return its promise; `stop_all_streams` is an `on_unsubscribe` callback,
and `runCallbacks` awaits a promise-returning callback
(`runCallbacks`, `packages/activesupport/src/callbacks.ts:1236-1275`).

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/streams.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`coder: nil` means "do not decode"**, and it is the default. `stream_decoder` returns the bare handler when `coder` is nil (`:194-200`); only `default_stream_handler` substitutes `ActiveSupport::JSON` (`:190`). A TS default parameter would turn a forwarded `undefined` into JSON in the wrong place.
- [ ] **`callback || block`**: the positional callback wins over the block.
- [ ] **The handler stored in `streams` is the worker-pool wrapper**, and that same object is what `stop_stream_from` passes to `pubsub.unsubscribe`. Unsubscribing with the inner handler removes nothing.
- [ ] **A second `stream_from` for the same broadcasting overwrites `streams[broadcasting]`** without unsubscribing the first handler. That is Rails' behaviour; do not fix it.
- [ ] **`defer_subscription_confirmation!` runs synchronously, before the post.** The matching `ensure_confirmation_sent` runs in the success callback. `stream_test.rb` asserts the confirmation is sent exactly once across several `stream_from` calls.
- [ ] **`stop_all_streams` is `streams.each { … }.clear`**: it unsubscribes every handler, then empties the same hash.
- [ ] **`stop_stream_from` logs only when a handler was removed** (`if callback`).
- [ ] **`stream_or_reject_for(model)`** tests `if model`, Ruby truthiness: `0` and `""` stream.
- [ ] **`worker_pool_stream_handler`** returns a lambda calling `connection.worker_pool.async_invoke handler, :call, message, connection: connection`. The receiver is the handler Proc and the method is `:call`.
- [ ] **`handler.(coder.decode(message))`** is `handler.call(…)`.
- [ ] **`via = "streamed from #{broadcasting}"`** is passed to `transmit` and shows in the debug log and the notification payload.
- [ ] **`String(broadcasting)` for a Symbol** drops the colon; `stream_test.rb:75` ("stream from non-string channel") subscribes to `"channel"`.

## Acceptance criteria

- [ ] `streams.rb` reads complete in `parity:api`, private helpers private.
- [ ] A `.trails.test.ts` on a minimal host and a recording pubsub covers: nil coder passes the raw message to a user handler; the default handler JSON-decodes and transmits with `via`; `stop_stream_from` unsubscribes the stored wrapper; `stop_all_streams` awaits each unsubscribe.

## Definition of done

A `coder = ActiveSupport.JSON` default parameter on `streamFrom` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/streams.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
