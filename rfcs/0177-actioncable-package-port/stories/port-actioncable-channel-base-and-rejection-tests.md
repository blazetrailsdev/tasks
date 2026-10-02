---
title: "Port channel/base_test.rb and channel/rejection_test.rb"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-channel-base", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/channel/base_test.rb` (285 lines, 23 cases) and
`channel/rejection_test.rb` (56 lines, 2 cases), both against
`TestConnection`.

`base_test.rb` defines `ActionCable::Channel::BaseTest::ChatChannel` and
its parents inline; mirror them inside the test file with their Ruby constant
names, since `channel_class` payloads and log lines assert
`"ActionCable::Channel::BaseTest::ChatChannel"`.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/channel/base_test.rb`:
  - [ ] `should subscribe to a channel` (`:94`)
  - [ ] `on subscribe callbacks` (`:99`)
  - [ ] `channel params` (`:104`)
  - [ ] `does not log filtered parameters` (`:108`)
  - [ ] `unsubscribing from a channel` (`:117`)
  - [ ] `connection identifiers` (`:129`)
  - [ ] `callable action without any argument` (`:133`)
  - [ ] `callable action with arguments` (`:138`)
  - [ ] `should not dispatch a private method` (`:145`)
  - [ ] `should not dispatch a public method defined on Base` (`:150`)
  - [ ] `should dispatch a public method defined on Base and redefined on channel` (`:155`)
  - [ ] `should dispatch calling a public method defined in an ancestor` (`:162`)
  - [ ] `should dispatch receive action when perform_action is called with empty action` (`:167`)
  - [ ] `transmitting data` (`:173`)
  - [ ] `do not send subscription confirmation on initialize` (`:180`)
  - [ ] `subscription confirmation on subscribe_to_channel` (`:184`)
  - [ ] `actions available on Channel` (`:190`)
  - [ ] `invalid action on Channel` (`:195`)
  - [ ] `notification for perform_action` (`:201`)
  - [ ] `notification for transmit` (`:217`)
  - [ ] `notification for transmit_subscription_confirmation` (`:233`)
  - [ ] `notification for transmit_subscription_rejection` (`:251`)
  - [ ] `behaves like rescuable` (`:265`)
- `vendor/rails/v8.0.2/actioncable/test/channel/rejection_test.rb`:
  - [ ] `subscription rejection` (`:23`)
  - [ ] `does not execute action if subscription is rejected` (`:38`)

## Fidelity traps (predicted at authoring)

- [ ] **Four notification cases** subscribe to `perform_action.action_cable`, `transmit.action_cable`, `transmit_subscription_confirmation.action_cable` and `transmit_subscription_rejection.action_cable` and assert the whole payload hash.
- [ ] **"does not log filtered parameters"** sets `filter_parameters` on the stub config and asserts the log line.
- [ ] **"behaves like rescuable"** raises from an action and asserts the `rescue_from` handler ran; the action is async in trails.
- [ ] **"should not dispatch a private method"** and its three siblings are the acceptance test for the `action_methods` decision. The file reopens `ActionCable::Channel::Base` to add public `kick` and `topic` (`:9-16`); add them to the prototype in the test file and fire `methodAdded`, and remove them afterwards so no other test file sees them.
- [ ] **"actions available on Channel"** compares against a thirteen-name set that includes `subscribed`, `unsubscribed`, the readers `room` and `last_action`, and `subscribed?`. Spell the set in the trails names the Open question 7 decision produces.
- [ ] **"invalid action on Channel"** uses `assert_logged` on `"Unable to process ActionCable::Channel::BaseTest::ChatChannel#invalid_action"`.
- [ ] **`rejection_test.rb`** stubs `connection.subscriptions` with a `Minitest::Mock` expecting `remove_subscription` with a `SecretChannel` argument (matched by class), asserts the last transmission is the `reject_subscription` message, and that `perform_action` on the rejected channel adds no transmission.
- [ ] **An extra assertion in a matched test reds the assertion ratchet.** Port the assertions Rails has.

## Acceptance criteria

- [ ] All 25 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/base.test.ts packages/actioncable/src/channel/rejection.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
