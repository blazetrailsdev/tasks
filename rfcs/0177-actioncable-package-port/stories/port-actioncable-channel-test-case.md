---
title: "Port Channel::TestCase, ChannelStub and ConnectionStub"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-test-helper-and-test-case",
    "port-actioncable-channel-base",
    "port-actioncable-connection-subscriptions-and-message-buffer",
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

`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/test_case.rb` (356 lines, about 200 of code), Tier 1. Its Rails
test is ported in `port-actioncable-channel-test-case-test`.

- `NonInferrableChannelError` with its three-part message (`:12-18`).
- `ChannelStub` (`:24-48`): `confirmed?`, `rejected?`,
  `stream_from(broadcasting, *)`, `stop_all_streams`, `streams`,
  `start_periodic_timers` and its alias `stop_periodic_timers`.
- `ConnectionStub` (`:50-86`): `attr_reader :server, :transmissions,
:identifiers, :subscriptions, :logger`;
  `delegate :pubsub, :config, to: :server`; `initialize(identifiers = {})`;
  `transmit`; `connection_identifier`; private `connection_gid`.
- `TestCase::Behavior` (`:191-351`): `CHANNEL_IDENTIFIER = "test_stub"`;
  `class_attribute :_channel_class`; `attr_reader :connection,
:subscription`; `run_load_hooks(:action_cable_channel_test_case, self)`;
  class methods `tests`, `channel_class`, `determine_default_channel`;
  instance methods `stub_connection`, `subscribe`, `unsubscribe`,
  `perform`, `transmissions`, `assert_broadcasts`,
  `assert_broadcast_on`, `assert_no_streams`, `assert_has_stream`,
  `assert_has_stream_for`, `assert_has_no_stream`,
  `assert_has_no_stream_for`; private `check_subscribed!` and
  `broadcasting_for`.

**Async.** `subscribe`, `unsubscribe` and `perform` await the channel;
`assert_broadcasts` and `assert_broadcast_on` await `super`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/test_case.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`@subscription.singleton_class.include(ChannelStub)`** puts the stub's methods ahead of the channel's own for that one instance. Port with `rbObjSingletonClass` (CLAUDE.md § "`singleton_class` is a per-object subclass") and `include()`. `ChannelStub#stream_from` must win over `Streams#stream_from`, and the class must be untouched for the next test.
- [ ] **`ChannelStub#streams` is an Array** where `Streams#streams` is a Hash, sharing the ivar `@_streams`. `stop_all_streams` assigns `[]`. `Streams#stop_stream_from` (not stubbed) calls `streams.delete(broadcasting)` on that Array and then `pubsub.unsubscribe` if something was deleted; `test_case_test.rb:117-122` relies on it.
- [ ] **`ConnectionStub` defines a singleton method per identifier** returning the value, and `connection_identifier` joins them with `send(id.to_sym) if id`. The Rails test expects `"John:true"` for `username: "John", admin: true`.
- [ ] **`transmit` stores `cable_message.with_indifferent_access`**, and `transmissions` in the test case returns only entries with a `"message"` key (`filter_map`).
- [ ] **`tests`' `case`**: a String or Symbol is `channel.to_s.camelize.constantize`; a Module is taken as is; anything else raises `NonInferrableChannelError`. A Symbol `:test_test_channel` and a String `"test_test_channel"` both resolve `TestTestChannel`.
- [ ] **`channel_class` falls back to `determine_constant_from_test_name(name)`** (`packages/activesupport/src/testing/constant-lookup.ts:4`) with a block requiring a `Channel::Base` subclass, and memoizes through `tests`.
- [ ] **`subscribe(params = {})`** builds the channel with `params.with_indifferent_access` and `CHANNEL_IDENTIFIER`, and uses `@connection ||= stub_connection`.
- [ ] **`perform(action, data = {})`** merges `"action" => action.to_s` into `data.stringify_keys`.
- [ ] **`check_subscribed!` raises `"Must be subscribed!"`** when there is no subscription or it was rejected.
- [ ] **`broadcasting_for`** passes a String through and calls the channel class otherwise; `assert_broadcasts(stream_or_object, *args)` forwards the rest to `super`.
- [ ] **`alias stop_periodic_timers start_periodic_timers`**: an alias of an empty method, so a channel with `periodically` does not start timers under test.
- [ ] **The four `assert_has_*` messages** interpolate `subscription.streams.count` and the stream name.
- [ ] **`Behavior` is a Concern included into `TestCase`**, so applications can include it into their own base class.

## Acceptance criteria

- [ ] `channel/test_case.rb` reads complete in `parity:api`.
- [ ] `ActionCable.Channel.TestCase` is exported, and `on_load(:action_cable_channel_test_case)` fires with it.
- [ ] A `.trails.test.ts` proves the stub methods apply to one subscription only and the channel class's prototype is unchanged afterwards.

## Definition of done

Patching `Streams#stream_from` on the channel class, or a `ChannelStub` subclass of the channel, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/test-case.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
