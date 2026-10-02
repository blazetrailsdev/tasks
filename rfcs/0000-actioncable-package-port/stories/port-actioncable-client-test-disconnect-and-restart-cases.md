---
title: "Port client_test.rb's unsubscribe, remote disconnect and server restart cases"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps:
  ["port-actioncable-client-test-harness-and-client-cases", "port-actioncable-remote-connections"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The other four cases of `vendor/rails/v8.0.2/actioncable/test/client_test.rb` (`:273-343`), on the harness
from `port-actioncable-client-test-harness-and-client-cases`. Two of them are
the only Rails coverage of `RemoteConnections`.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/client_test.rb`:
  - [ ] `unsubscribe client` (`:273`)
  - [ ] `remote disconnect client` (`:297`)
  - [ ] `remote disconnect client with reconnect` (`:314`)
  - [ ] `server restart` (`:331`)

## Fidelity traps (predicted at authoring)

- [ ] **"unsubscribe client"** reaches into `app.connections.first.subscriptions.send(:subscriptions)` (a private reader), takes the first channel, asserts its `unsubscribed` is called when the client closes, and then that `app.connections.count` is 0. It sleeps 0.1s for the close to be processed.
- [ ] **"remote disconnect client"** connects with `/?id=1`, calls `app.remote_connections.where(id: "1").disconnect`, and expects `{ "type" => "disconnect", "reason" => "remote", "reconnect" => true }` and then a closed socket. `disconnect` returns a promise in trails.
- [ ] **"remote disconnect client with reconnect"** passes `reconnect: false` and expects it on the wire; this is the stored-`false` path through `message.fetch("reconnect", true)`.
- [ ] **"server restart"** calls `ActionCable.server.restart` and expects the client closed. `restart` is async in trails; await it.
- [ ] **Both remote cases sleep 0.1s** "to make sure connections is registered": the internal-channel subscribe is posted to the event loop.

## Acceptance criteria

- [ ] All four cases are ported under their Rails names and credited in `parity:test`; `client_test.rb` reads 8 of 8.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.
