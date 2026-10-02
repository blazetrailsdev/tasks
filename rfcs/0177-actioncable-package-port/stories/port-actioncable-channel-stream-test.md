---
title: "Port channel/stream_test.rb"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-channel-base",
    "port-actioncable-connection-base",
    "port-actioncable-inline-async-and-test-adapters",
    "port-actioncable-test-stubs-and-test-helper",
  ]
deps-rfc: []
est-loc: 550
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/channel/stream_test.rb` (370 lines, 13 cases in two test classes).
`StreamTest` runs against `TestConnection`; `StreamFromTest` builds a real
`Connection::Base` subclass over `TestServer` with a hijacked socket, which
is why this story depends on `port-actioncable-connection-base`.

It defines `ChatChannel`, `SymbolChannel`, `DummyEncoder` and the
`UserCallbackChannel` / `MultiChatChannel` family inline, under
`ActionCable::StreamTests`.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/channel/stream_test.rb`:
  - [ ] `streaming start and stop` (`:55`, `StreamTest`)
  - [ ] `stream from non-string channel` (`:75`, `StreamTest`)
  - [ ] `stream_for` (`:96`, `StreamTest`)
  - [ ] `stream_or_reject_for` (`:113`, `StreamTest`)
  - [ ] `reject subscription when nil is passed to stream_or_reject_for` (`:130`, `StreamTest`)
  - [ ] `stream_from subscription confirmation` (`:146`, `StreamTest`)
  - [ ] `subscription confirmation should only be sent out once` (`:164`, `StreamTest`)
  - [ ] `stop_all_streams` (`:181`, `StreamTest`)
  - [ ] `stop_stream_from` (`:216`, `StreamTest`)
  - [ ] `stop_stream_for` (`:249`, `StreamTest`)
  - [ ] `custom encoder` (`:312`, `StreamFromTest`)
  - [ ] `user supplied callbacks are run through the worker pool` (`:325`, `StreamFromTest`)
  - [ ] `subscription confirmation should only be sent out once with multiple stream_from` (`:336`, `StreamFromTest`)

## Fidelity traps (predicted at authoring)

- [ ] **`Minitest::Mock.new connection.pubsub`** with `expect(:subscribe, nil, ["test_room_1", Proc, Proc])` asserts the argument classes: the handler and the success callback are both callables.
- [ ] **Every case is wrapped in `run_in_eventmachine`** and ends in `wait_for_async`; the assertions depend on posted subscribes having run.
- [ ] **"custom encoder"** uses `DummyEncoder`, a module with `encode` / `decode`, as the `coder:`.
- [ ] **"user supplied callbacks are run through the worker pool"** has the callback set `Thread.current[:ran_callback] = true` and asserts the test's own thread does **not** see it. It passes only if each worker task runs in its own ruby-compat `Thread`.
- [ ] **"custom encoder"** also calls `wait_for_executor connection.server.worker_pool.executor`: `Worker#executor` and the executor's task counts are read from a test.
- [ ] **`StreamFromTest`** builds `TestServer.new(subscription_adapter: ActionCable::SubscriptionAdapter::Async)` and drives `connection.dispatch_websocket_message` with JSON it generates.
- [ ] **The two "subscription confirmation should only be sent out once" cases** count transmissions after several `stream_from` calls and an explicit `send_confirmation`.
- [ ] **"stop_stream_from" / "stop_stream_for" / "stop_all_streams"** read `connection.pubsub.subscriber_map` (`SuccessAdapter`'s public hash) and count handlers per broadcasting right after the `stop_*` call, with no `wait_for_async` in between. `stop_*` returns a promise in trails; await it where Rails' call is synchronous.

## Acceptance criteria

- [ ] All 13 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case, or a fake connection where Rails uses the real class, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/stream.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
