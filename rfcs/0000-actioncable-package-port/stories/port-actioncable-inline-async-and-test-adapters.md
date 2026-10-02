---
title: "Port the Inline, Async and Test subscription adapters and the shared adapter test modules"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: ["port-actioncable-server-connections-and-base"]
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/inline.rb` (39 lines), `async.rb` (29) and
`test.rb` (41), Tier 1 and pure code.

- `Inline < Base`: `broadcast` / `subscribe` / `unsubscribe` delegate
  to `subscriber_map` (`inline.rb:13-23`); `shutdown` is a no-op
  (`:25-27`); `subscriber_map` (`:30-32`) is the lazy reader over
  `@server.mutex.synchronize`, building it with `new_subscriber_map`.
- `Async < Inline`: `new_subscriber_map` returns an `AsyncSubscriberMap`,
  whose `add_subscriber(*)` and `invoke_callback(*)` are
  `@event_loop.post { super }` (`async.rb:13-25`).
- `Test < Async`: `broadcast` records into `broadcasts(channel)` and
  calls `super`; `broadcasts`, `clear_messages`, `clear`
  (`test.rb:18-38`).

**Shared test modules.** `common.rb` (`CommonSubscriptionAdapterTest`,
eight cases and `subscribe_as_queue`) and `channel_prefix.rb`
(`ChannelPrefixTest`, one case) are modules that the adapter test classes
include. Port both here as reusable suites, credited the way
`enroll-actioncable-in-compare-tooling-and-parity-gates` decided.
`async_test.rb`, `inline_test.rb` and `test_adapter_test.rb` each include
the common suite, so its eight cases run against three adapters here (24 runs);
the first two define only `setup` and `cable_config`, the third adds three
cases of its own. The PostgreSQL and Redis stories include both suites.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/inline.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/async.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/test.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/common.rb` (shared module; cases are `def test_*` methods, run once per including class):
  - [ ] `test_subscribe_and_unsubscribe`
  - [ ] `test_basic_broadcast`
  - [ ] `test_broadcast_after_unsubscribe`
  - [ ] `test_multiple_broadcast`
  - [ ] `test_identical_subscriptions`
  - [ ] `test_simultaneous_subscriptions`
  - [ ] `test_channel_filtered_broadcast`
  - [ ] `test_long_identifiers`
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/channel_prefix.rb` (shared module; cases are `def test_*` methods, run once per including class):
  - [ ] `test_channel_prefix`
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/async_test.rb` includes the shared suite from `subscription_adapter/common.rb`; every included case runs under this class.
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/inline_test.rb` includes the shared suite from `subscription_adapter/common.rb`; every included case runs under this class.
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/test_adapter_test.rb`:
  - [ ] `#broadcast stores messages for streams` (`:20`)
  - [ ] `#clear_messages deletes recorded broadcasts for the channel` (`:28`)
  - [ ] `#clear deletes all recorded broadcasts` (`:38`)
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/test_adapter_test.rb` also includes the shared suite from `subscription_adapter/common.rb`; every included case runs under this class.

## Fidelity traps (predicted at authoring)

- [ ] **`Test#broadcast` appends before `super`**, so a message is recorded even if delivery fails.
- [ ] **`broadcasts(channel)` stores on read** (`channels_data[channel] ||= []`) and returns the live array; `TestHelper` reads `.size` off it and holds it across a `clear_messages`, which replaces the array instead of emptying it.
- [ ] **`clear` sets `@channels_data = nil`**; the next read rebuilds the hash.
- [ ] **`@event_loop.post { super }`** forwards the original arguments (zsuper inside a block). `add_subscriber`'s success callback therefore runs on the executor, later, which is why `subscribe_as_queue` waits on an event.
- [ ] **`AsyncSubscriberMap` is a private constant nested in `Async`.**
- [ ] **`subscribe_as_queue`** blocks on `Concurrent::Event#wait(3)` and then on `Queue#pop`. In trails both are awaits with a timeout; a missing success callback must fail the test, not hang it.
- [ ] **The `sleep WAIT_WHEN_NOT_EXPECTING_EVENT` then `assert_empty queue`** arm asserts no stray delivery after the block. Keep the wait.
- [ ] **`test_long_identifiers`** uses 101-character channel names; it exists for PostgreSQL's 63-byte identifier limit and must run against every adapter.
- [ ] **`setup` in `async_test` / `inline_test`** shuts `@tx_adapter` down and makes it the same object as `@rx_adapter`: an in-process adapter only delivers to its own subscriber map.

## Acceptance criteria

- [ ] All three lib files read complete in `parity:api`.
- [ ] The common suite's eight cases run against `async`, `inline` and `test`, and `test_adapter_test.rb`'s three own cases are ported; all are credited in `parity:test`.
- [ ] The suites are importable by the PostgreSQL and Redis adapter tests without copying.

## Definition of done

Copying the eight common cases into each adapter's test file does not close this story.
