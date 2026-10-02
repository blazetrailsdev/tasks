---
title: "Port connection/subscriptions_test.rb"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-connection-base",
    "port-actioncable-channel-base",
    "port-actioncable-test-stubs-and-test-helper",
  ]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/connection/subscriptions_test.rb` (160 lines, 8 cases), against a real
`Connection::Base` subclass and a `ChatChannel` defined in the test.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/connection/subscriptions_test.rb`:
  - [ ] `subscribe command` (`:50`)
  - [ ] `subscribe command without an identifier` (`:60`)
  - [ ] `subscribe command with Base channel` (`:69`)
  - [ ] `unsubscribe command` (`:80`)
  - [ ] `unsubscribe command without an identifier` (`:95`)
  - [ ] `message command` (`:104`)
  - [ ] `accessing exceptions thrown during command execution` (`:116`)
  - [ ] `unsubscribe from all` (`:129`)

## Fidelity traps (predicted at authoring)

- [ ] **The identifier is `ActiveSupport::JSON.encode(id: 1, channel: "ActionCable::Connection::SubscriptionsTest::ChatChannel")`**: the channel resolves through `safe_constantize` by its full Ruby name.
- [ ] **"subscribe command with Base channel"** sends `channel: "ActionCable::Channel::Base"` and asserts no subscription was added.
- [ ] **"subscribe command without an identifier"** and "unsubscribe command without an identifier" assert nothing was added or removed and that the error was logged, not raised.
- [ ] **"accessing exceptions thrown during command execution"** registers a `rescue_from` on the connection and asserts it received the error raised inside the channel.
- [ ] **"unsubscribe from all"** subscribes two channels and asserts each got `unsubscribe_from_channel`.

## Acceptance criteria

- [ ] All 8 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/subscriptions.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
