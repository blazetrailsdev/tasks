---
title: "Port client_test.rb's harness and its first four cases against a real server"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps:
  [
    "rack-handler-node-offers-rack-hijack-on-upgrade",
    "port-actioncable-connection-base",
    "port-actioncable-channel-base",
    "port-actioncable-inline-async-and-test-adapters",
    "port-actioncable-test-stubs-and-test-helper",
  ]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/client_test.rb` (343 lines, 8 cases) is the only Rails test that runs
Action Cable end to end: a real server on a TCP port and real WebSocket
clients. It is the acceptance test for the whole socket path, and the one
place `rack-handler-node-offers-rack-hijack-on-upgrade` is exercised by
Action Cable itself.

This story ports the harness (`:1-200`) and the first four cases:

- `ClientTest::Connection` (`identified_by :id`, `connect` reading
  `request.params["id"]`) and `ClientTest::EchoChannel` (`ding`,
  `delay`, `bulk`).
- `setup` (`:42-51`): reset `ActionCable.@server`, configure the
  `async` adapter, the connection class, and
  `disable_request_forgery_protection = true`.
- `with_puma_server(rack_app = ActionCable.server, port = 3099)`
  (`:53-80`): in trails, `Rack::Handler::Node.run` on a port, shut down in
  `ensure`.
- `SyncClient` (`:82-193`): `read_message`, `read_messages`,
  `send_message`, `close`, `wait_for_close`, `closed?`, and a `pings`
  counter. Rails uses the `websocket-client-simple` gem; Node's global
  `WebSocket` client is the counterpart, so no new dependency is needed.
- `concurrently` (`:199-201`).

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/client_test.rb`:
  - [ ] `single client` (`:203`)
  - [ ] `interacting clients` (`:215`)
  - [ ] `many clients` (`:238`)
  - [ ] `disappearing client` (`:254`)

## Fidelity traps (predicted at authoring)

- [ ] **Do not hard-code port 3099.** Parallel vitest workers collide; listen on an ephemeral port and pass it to the client.
- [ ] **The channel is named on the wire**: `JSON.generate(channel: "ClientTest::EchoChannel")`. The class must resolve by that Ruby name through `safe_constantize`.
- [ ] **Every case first asserts the welcome message** `{ "type" => "welcome" }`, and compares whole decoded hashes, including `"identifier" => "{\"channel\":\"ClientTest::EchoChannel\"}"`, so JSON key order in the identifier string matters.
- [ ] **Pings are counted, not queued.** `SyncClient` filters `type: "ping"` out of the message queue. A heartbeat at time zero or one that lands in the queue breaks `read_messages` counts.
- [ ] **`read_message` waits up to 2 seconds; `read_messages` stops after 0.5 seconds of silence** once it has the expected count. Keep both timeouts.
- [ ] **"interacting clients"** runs 10 clients through two `CyclicBarrier`s so that every `bulk` broadcast is sent only after all clients subscribed; each then reads exactly 10 messages.
- [ ] **"many clients"** opens 100 connections concurrently.
- [ ] **"disappearing client"** closes the socket while `delay` is sleeping (`sleep 1`, an awaited timer in trails), then asserts a second client still works: a write to a gone client must not take the server down. This is the end-to-end test of `Stream#write`'s error path.
- [ ] **`close` raises if messages are unprocessed** (`"#{n} messages unprocessed"`).
- [ ] **`server.stop` must close upgraded sockets**, or the test process hangs at exit.

## Acceptance criteria

- [ ] The harness and the four cases are ported under their Rails names and credited in `parity:test`.
- [ ] The server under test is `ActionCable.server` behind `Rack::Handler::Node`, reached over TCP by a real WebSocket client, with no test double anywhere on the path.
- [ ] The file leaves no listening socket, open client or timer behind.

## Definition of done

Driving `Connection::Base` directly, or mocking the handler, does not close this story.
