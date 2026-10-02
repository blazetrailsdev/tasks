---
title: "Port channel/test_case_test.rb"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-channel-test-case"]
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/channel/test_case_test.rb` (251 lines, 21 cases in ten test classes).
Each class defines the channel it tests at top level (`TestTestChannel`,
`SubscriptionsTestChannel`, `RejectionTestChannel`, `StreamsTestChannel`,
`StreamsForTestChannel`, …), and several rely on the default lookup from the
test class's name.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/channel/test_case_test.rb`:
  - [ ] `set channel class manual` (`:11`, `NonInferrableExplicitClassChannelTest`)
  - [ ] `set channel class manual using symbol` (`:19`, `NonInferrableSymbolNameChannelTest`)
  - [ ] `set channel class manual using string` (`:27`, `NonInferrableStringNameChannelTest`)
  - [ ] `no subscribe` (`:40`, `SubscriptionsTestChannelTest`)
  - [ ] `subscribe` (`:44`, `SubscriptionsTestChannelTest`)
  - [ ] `connection identifiers` (`:58`, `StubConnectionTest`)
  - [ ] `rejection` (`:76`, `RejectionTestChannelTest`)
  - [ ] `stream without params` (`:98`, `StreamsTestChannelTest`)
  - [ ] `stream with params` (`:104`, `StreamsTestChannelTest`)
  - [ ] `not stream without params` (`:110`, `StreamsTestChannelTest`)
  - [ ] `not stream with params` (`:117`, `StreamsTestChannelTest`)
  - [ ] `unsubscribe from stream` (`:124`, `StreamsTestChannelTest`)
  - [ ] `stream with params` (`:143`, `StreamsForTestChannelTest`)
  - [ ] `not stream with params` (`:149`, `StreamsForTestChannelTest`)
  - [ ] `stream with params` (`:162`, `NoStreamsTestChannelTest`)
  - [ ] `perform with params` (`:186`, `PerformTestChannelTest`)
  - [ ] `perform and transmit` (`:192`, `PerformTestChannelTest`)
  - [ ] `perform when unsubscribed` (`:202`, `PerformUnsubscribedTestChannelTest`)
  - [ ] `broadcast matchers included` (`:230`, `BroadcastsTestChannelTest`)
  - [ ] `broadcast to object` (`:236`, `BroadcastsTestChannelTest`)
  - [ ] `broadcast to object with data` (`:244`, `BroadcastsTestChannelTest`)

## Fidelity traps (predicted at authoring)

- [ ] **Case names repeat across classes** (`stream with params` three times, `not stream with params` twice). Each lives under its own `describe` named after the Ruby class, which is how `parity:test` tells them apart.
- [ ] **Three classes exercise `tests`**: with the class, with `:test_test_channel`, and with `"test_test_channel"`.
- [ ] **`SubscriptionsTestChannelTest`, `RejectionTestChannelTest` and `StreamsTestChannelTest` have no `tests` call**: the channel is inferred from the test class name by stripping `Test`.
- [ ] **"not stream with params"** calls `perform :unsubscribed, id: 42`, dispatching the channel's public `unsubscribed` as an action.
- [ ] **"connection identifiers"** asserts `subscription.username`, `subscription.admin` and `connection.connection_identifier == "John:true"`.
- [ ] **"perform when unsubscribed"** is a bare `assert_raises do perform :echo end`, with no class or message; the raise is `check_subscribed!`'s, from an async `perform`.
- [ ] **`BroadcastsTestChannel` has an action named `broadcast`** and one named `broadcast_to_user` that calls the instance `broadcast_to`. The action must not shadow or be shadowed by `Channel::Broadcasting`'s methods.
- [ ] **"perform with params"** asserts `transmissions.last == { "text" => "You are man!" }` after the channel deletes `"action"` from the data hash it was handed.
- [ ] **The last class covers the broadcast matchers** with a model object: `assert_broadcasts(user, 1)` and `assert_broadcast_on(user, …)` go through `broadcasting_for`.

## Acceptance criteria

- [ ] All 21 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case, or an explicit `tests` call where Rails infers the channel, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/test-case.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
