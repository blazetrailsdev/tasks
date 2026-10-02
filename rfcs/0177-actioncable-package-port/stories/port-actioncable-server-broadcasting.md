---
title: "Port Server::Broadcasting and Broadcaster"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-subscriber-map-base-adapter-and-channel-prefix"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/broadcasting.rb` (62 lines), Tier 1. Its Rails test
(`server/broadcasting_test.rb`) needs `TestServer` and is ported in
`port-actioncable-test-stubs-and-test-helper`.

- `broadcast(broadcasting, message, coder: ActiveSupport::JSON)` (`:31-33`).
- `broadcaster_for(broadcasting, coder: ActiveSupport::JSON)` (`:38-40`):
  `Broadcaster.new(self, String(broadcasting), coder: coder)`.
- Private `Broadcaster` (`:43-59`): `attr_reader :server, :broadcasting,
:coder`, and `broadcast(message)`, which logs at debug with a block,
  builds the payload, and inside
  `ActiveSupport::Notifications.instrument("broadcast.action_cable", payload)`
  encodes and calls `server.pubsub.broadcast`.

**Async.** `pubsub.broadcast` returns a promise, so `Broadcaster#broadcast`
and `Server::Broadcasting#broadcast` return one. This is where
`ActionCable.server.broadcast`, a synchronous Rails-facing API, becomes a
promise (RFC "Async surface").

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/broadcasting.rb`

## Fidelity traps (predicted at authoring)

- [ ] **The `instrument` block must await `pubsub.broadcast`** so the event's duration covers the publish and a failure is recorded on the event. `Notifications.instrument` already handles a promise-returning block (`packages/activesupport/src/notifications/instrumenter.ts:176`).
- [ ] **`coder ? coder.encode(message) : message`**: `coder: nil` sends the message raw. It is a Ruby truthiness test on an object; port as `coder != null`.
- [ ] **The `coder:` default.** A caller forwarding an absent `coder` as `undefined` would get JSON where Ruby would see `nil` and send raw. `Channel::Streams` relies on `coder: nil`.
- [ ] **`String(broadcasting)`** converts a Symbol: `:channel` is `"channel"`, with no colon. `server/broadcasting_test.rb:7` asserts it.
- [ ] **`message.inspect.truncate(300)`** is Ruby `inspect` (`rbInspect`), evaluated inside the debug block, so not at all when debug is off.
- [ ] **The payload hash is `{ broadcasting:, message:, coder: }`**, asserted key by key in the Rails test.

## Acceptance criteria

- [ ] `broadcasting.rb` reads complete in `parity:api`.
- [ ] `broadcast` returns a promise that resolves after the adapter's `broadcast` settles and rejects when it rejects.
- [ ] A `.trails.test.ts` covers `coder: null`, a Symbol-named broadcasting, and the lazy debug block.

## Definition of done

An unawaited `pubsub.broadcast` inside the instrument block does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/server/broadcasting.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
