---
title: "Port Connection::Subscriptions and Connection::MessageBuffer"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["actioncable-class-names-round-trip-through-constantize"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/subscriptions.rb` (85 lines) and
`connection/message_buffer.rb` (57), Tier 1. `subscriptions_test.rb` is
ported in `port-actioncable-connection-subscriptions-test`.

`Subscriptions`:

- `execute_command(data)` (`:20-31`): a `case` on `data["command"]`
  with three arms and an else that logs; `rescue Exception` calls
  `@connection.rescue_with_handler(e)` and logs.
- `add(data)` (`:33-48`), `remove(data)` (`:50-53`),
  `remove_subscription(subscription)` (`:55-58`),
  `perform_action(data)` (`:60-62`), `identifiers` (`:64-66`),
  `unsubscribe_from_all` (`:68-70`).
- Private: `attr_reader :connection, :subscriptions`,
  `delegate :logger, to: :connection`, `find(data)` (`:73-82`).

`MessageBuffer`: `append`, `processing?`, `process!`, and private
`valid?`, `receive`, `buffer`, `receive_buffered_messages`
(`:10-54`).

**Async.** Subscribing, unsubscribing and performing an action run user code,
so `execute_command`, `add`, `remove`, `remove_subscription`,
`perform_action` and `unsubscribe_from_all` are async.
`MessageBuffer` stays synchronous: `connection.receive` only posts to the
worker pool.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/subscriptions.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/message_buffer.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`execute_command` logs after rescuing**, whether or not a handler took the error, and does not re-raise. `e.backtrace.first(5).join(" | ")`.
- [ ] **`add` decodes the identifier with `with_indifferent_access`**, and passes the raw `id_key` string as the channel's identifier and the decoded hash as its params.
- [ ] **`return if subscriptions.key?(id_key)`**: a duplicate subscribe is silently ignored.
- [ ] **`ActionCable::Channel::Base > subscription_klass`** is strict: `Base` itself is refused (`subscriptions_test.rb:69`, "subscribe command with Base channel"). An unrelated class or module makes `>` return nil, which takes the else arm; a constant that is not a Module at all makes it raise `TypeError`, which `execute_command`'s rescue logs.
- [ ] **`id_options[:channel].safe_constantize`** on a missing key calls `safe_constantize` on nil and raises `NoMethodError`, which the rescue in `execute_command` logs ("subscribe command without an identifier" covers the neighbouring case where `identifier` is absent and JSON decoding raises).
- [ ] **`unsubscribe_from_all` iterates the hash while `remove_subscription` deletes from it.** Ruby raises on adding a key during iteration, not on delete. Iterate over a stable view and await each removal in order; a `Promise.all` would run the `unsubscribed` hooks concurrently.
- [ ] **`find` raises a plain `RuntimeError`** with "Unable to find subscription with identifier: …".
- [ ] **`perform_action` decodes `data["data"]`** with `ActiveSupport::JSON.decode`; a nil `data` raises there.
- [ ] **`MessageBuffer#processing?` returns the ivar** (nil before `process!`), and `append` logs `message.class` for a non-String.
- [ ] **`receive buffered_messages.shift until buffered_messages.empty?`** drains in order.
- [ ] **`valid?` is `message.is_a?(String)`.** A binary frame arrives as an Array from the Ruby driver and as a `Buffer` from the npm driver; both are refused.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`.
- [ ] A `.trails.test.ts` with a fake connection and channel class covers the duplicate subscribe, the `Base` refusal, ordered `unsubscribe_from_all`, and buffered messages replayed in order by `process!`.

## Definition of done

`Promise.all` in `unsubscribe_from_all` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/subscriptions.trails.test.ts packages/actioncable/src/connection/message-buffer.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
