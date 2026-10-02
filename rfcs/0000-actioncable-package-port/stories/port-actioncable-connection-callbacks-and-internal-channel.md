---
title: "Port Connection::Callbacks and Connection::InternalChannel"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: ["port-actioncable-connection-identification-and-authorization"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/callbacks.rb` (57 lines) and
`connection/internal_channel.rb` (50), Tier 1.

`Callbacks` (`:34-55`): `include ActiveSupport::Callbacks`,
`define_callbacks :command`, and class methods `before_command`,
`after_command`, `around_command`.

`InternalChannel`, all private (`:15-47`):

- `internal_channel`: `"action_cable/#{connection_identifier}"`.
- `subscribe_to_internal_channel`: when `connection_identifier.present?`,
  builds a callback decoding the message, pushes `[internal_channel,
callback]` onto `@_internal_subscriptions`, and posts
  `pubsub.subscribe(internal_channel, callback)` to the server's event loop.
- `unsubscribe_from_internal_channel`: posts one `pubsub.unsubscribe` per
  stored pair.
- `process_internal_message(message)`: on `"disconnect"`, logs and closes
  with `reason: remote` and `reconnect: message.fetch("reconnect", true)`;
  `rescue Exception` logs twice and closes.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/callbacks.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/internal_channel.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`message.fetch("reconnect", true)`** returns a stored `false`. `?? true` happens to agree for `false`, but a stored `nil` must stay nil; port as `fetch`.
- [ ] **`connection_identifier.present?`**: an empty string (no identifiers set) skips the subscription. Use the ActiveSupport analogue.
- [ ] **`@_internal_subscriptions.present?`** in the unsubscribe: nil and `[]` both skip.
- [ ] **The stored callback is the one unsubscribed.** Same function object in both calls.
- [ ] **The posted subscribe returns a promise.** A rejection must be logged, not left unhandled.
- [ ] **`process_internal_message` rescues `Exception`** and calls bare `close` (default reason, `reconnect: true`).
- [ ] **`case message["type"]`** has one arm and no else; an unknown type does nothing.
- [ ] **`around_command` with an async block**: the command chain awaits (`handle_channel_command` is async).

## Acceptance criteria

- [ ] Both files read complete in `parity:api`, `InternalChannel`'s methods private.
- [ ] A `.trails.test.ts` on a minimal host covers a stored `reconnect: false`, a blank identifier, and the raise arm.

## Definition of done

`message.reconnect ?? true` does not close this story.
