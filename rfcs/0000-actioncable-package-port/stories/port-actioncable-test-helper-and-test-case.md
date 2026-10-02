---
title: "Port ActionCable::TestHelper and ActionCable::TestCase"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps:
  ["port-actioncable-inline-async-and-test-adapters", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/test_helper.rb` (163 lines) and `test_case.rb` (13), Tier 1, with
`vendor/rails/v8.0.2/actioncable/test/test_helper_test.rb` (141 lines, 13 cases).

- `before_setup` / `after_teardown` (`test_helper.rb:8-21`): swap a fresh
  `SubscriptionAdapter::Test` into the server's `@pubsub` ivar and restore
  the old adapter, each calling `super`.
- `assert_broadcasts(stream, number, &block)` (`:48-58`),
  `assert_no_broadcasts(stream, &block)` (`:80-82`),
  `capture_broadcasts(stream, &block)` (`:96-98`),
  `assert_broadcast_on(stream, data, &block)` (`:116-140`).
- `pubsub_adapter` (`:142-144`) and
  `delegate :broadcasts, :clear_messages, to: :pubsub_adapter` (`:146`).
- Private `new_broadcasts_from(current_messages, stream, assertion, &block)`
  (`:149-161`).
- `ActionCable::TestCase < ActiveSupport::TestCase` includes the helper and
  runs `run_load_hooks(:action_cable_test_case, self)` (`test_case.rb:8-12`).

This story also moves `wait_for_async`, `run_in_eventmachine` and
`wait_for_executor` from the suite's interim base onto the real
`ActionCable::TestCase`, where Rails' `test/test_helper.rb` reopens it.

**Async (RFC "Async surface").** The block passed to each assertion calls
`ActionCable.server.broadcast`, which returns a promise, and
`new_broadcasts_from` re-broadcasts the old and new messages. So the four
assertions are async, as `assertDifference` already is
(`packages/activesupport/src/testing/assertions.ts:183`); the no-block arms
return a promise too, since one method has one return type.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/test_helper.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/test_case.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/test_helper_test.rb`:
  - [ ] `assert broadcasts` (`:9`, `TransmissionsTest`)
  - [ ] `capture broadcasts` (`:17`, `TransmissionsTest`)
  - [ ] `assert broadcasts with no block` (`:32`, `TransmissionsTest`)
  - [ ] `assert no broadcasts with no block` (`:45`, `TransmissionsTest`)
  - [ ] `assert no broadcasts` (`:51`, `TransmissionsTest`)
  - [ ] `assert broadcasts message too few sent` (`:59`, `TransmissionsTest`)
  - [ ] `assert broadcasts message too many sent` (`:70`, `TransmissionsTest`)
  - [ ] `assert no broadcasts failure` (`:81`, `TransmissionsTest`)
  - [ ] `assert broadcast on` (`:95`, `TransmittedDataTest`)
  - [ ] `assert broadcast on with hash` (`:103`, `TransmittedDataTest`)
  - [ ] `assert broadcast on with no block` (`:111`, `TransmittedDataTest`)
  - [ ] `assert broadcast on message` (`:123`, `TransmittedDataTest`)
  - [ ] `assert broadcast on message with empty channel` (`:133`, `TransmittedDataTest`)

## Fidelity traps (predicted at authoring)

- [ ] **`new_broadcasts_from` holds the old array, then clears.** `old_messages = current_messages` is the live array `broadcasts(stream)` returned; `clear_messages(stream)` replaces it with a new one, so the old reference keeps its contents. Then the block runs, the new messages are read and cleared, and `(old_messages + new_messages).each { |m| pubsub_adapter.broadcast(stream, m) }` restores both. A port that empties the array in place loses the old messages.
- [ ] **The restore loop awaits each broadcast in order.** Order is asserted by `capture_broadcasts` callers.
- [ ] **`_assert_nothing_raised_or_warn(assertion, &block)`** is ActiveSupport's (`packages/activesupport/src/index.ts:618`); check it awaits an async block.
- [ ] **`assert_broadcast_on` compares decoded JSON**: `ActiveSupport::JSON.decode(ActiveSupport::JSON.encode(data))` against each message decoded, with `==`. A Hash with Symbol keys matches its String-keyed round trip.
- [ ] **Its failure message has three shapes**: `"No messages sent with #{data} to #{stream}"`, then either `"\nMessage(s) found:\n"` plus each decoded message on its own line, or `"\nNo message found for #{stream}"`. `#{data}` and each message are Ruby `to_s` of a Hash, which is `inspect`. `test_helper_test.rb` matches `/Message\(s\) found:\nhello/`.
- [ ] **`assert_broadcasts`' message** is `"#{number} broadcasts to #{stream} expected, but #{actual_count} were sent"`; three Rails cases match `/2 .* but 1/`, `/1 .* but 2/` and `/0 .* but 1/`.
- [ ] **`before_setup` writes `@pubsub` with `instance_variable_set`**, bypassing the lazy reader; `after_teardown` restores after `super`.
- [ ] **`capture_broadcasts` returns decoded messages**; a String message decodes to a String.
- [ ] **The failure cases use `assert_raises Minitest::Assertion`** around an async assertion; await inside.

## Acceptance criteria

- [ ] Both lib files read complete in `parity:api`.
- [ ] All 13 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `ActionCable.TestCase` is exported for applications, and `on_load(:action_cable_test_case)` fires with it.

## Definition of done

An `assertBroadcasts` that clears the adapter's array in place does not close this story.
