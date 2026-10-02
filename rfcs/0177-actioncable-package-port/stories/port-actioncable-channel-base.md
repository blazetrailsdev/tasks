---
title: "Port Channel::Base"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-channel-streams", "ruby-compat-concurrent-timer-task-and-atomic-fixnum"]
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/base.rb` (334 lines, about 150 of code), Tier 1. Its Rails
tests are ported in `port-actioncable-channel-base-and-rejection-tests`.

- Six includes, in this order: `Callbacks`, `PeriodicTimers`, `Streams`,
  `Naming`, `Broadcasting`, `ActiveSupport::Rescuable` (`:110-115`).
- `attr_reader :params, :connection, :identifier`;
  `delegate :logger, to: :connection` (`:117-118`).
- Class methods: `action_methods` (`:128-138`), private
  `clear_action_methods!` and `method_added` (`:144-152`).
- `initialize(connection, identifier, params = {})` (`:155-170`).
- Public: `perform_action(data)` (`:175-186`), `subscribe_to_channel`
  (`:190-197`), `unsubscribe_from_channel` (`:202-206`).
- Private: `subscribed`, `unsubscribed`, `transmit(data, via: nil)`,
  `ensure_confirmation_sent`, `defer_subscription_confirmation!`,
  `defer_subscription_confirmation?`, `subscription_confirmation_sent?`,
  `reject`, `subscription_rejected?`, `delegate_connection_identifiers`,
  `extract_action`, `processable_action?`, `dispatch_action`,
  `action_signature`, `parameter_filter`,
  `transmit_subscription_confirmation`, `reject_subscription`,
  `transmit_subscription_rejection` (`:212-329`).
- `ActiveSupport.run_load_hooks(:action_cable_channel, Base)` (`:334`).

**Async.** A channel's `subscribed`, `unsubscribed` and actions do I/O in
trails (every ActiveRecord read is awaited), so `subscribe_to_channel`,
`unsubscribe_from_channel`, `perform_action` and `dispatch_action` are
async and await the user method. `transmit`, `reject`,
`ensure_confirmation_sent` and the predicates stay synchronous.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/base.rb`

## Fidelity traps (predicted at authoring)

- [ ] **Which methods are actions (RFC Open question 6).** `action_methods` is `public_instance_methods(true) - Base.public_instance_methods(true) + public_instance_methods(false)`: public methods the subclass chain adds, plus any `Base` public method the subclass itself redefines. Ruby's `private` hides a method from it; TS `private` is erased at run time (CLAUDE.md § "Method visibility is compile-time only"). Use the mechanism `AbstractController::Base.action_methods` already uses (`packages/actionpack/src/abstract-controller/base.ts:172-209`) and record the decision at `action_methods`. `base_test.rb:145-167` has four cases on this: a private method, a public method defined on Base, one redefined on the channel, and one from an ancestor.
- [ ] **`method_added` clears the memo.** JS has no such hook. `AbstractController` ports it as an explicit static `methodAdded` (`abstract-controller/base.ts:195`); follow it, and guard the `@action_methods` memo per class.
- [ ] **`subscribed` / `unsubscribed` are private no-ops on `Base`**, but a subclass that overrides them without `private` makes them public, and they are then actions: `base_test.rb:190-193` expects `subscribed` and `unsubscribed` in `ChatChannel.action_methods`, along with the `attr_reader`s `room` and `last_action` and the predicate `subscribed?`. An accessor property and an `isSubscribed` predicate must be counted the same way.
- [ ] **Action names on the wire (RFC Open question 7).** `extract_action` turns the client's string into a method name. Rails clients send `get_latest`; the trails method is `getLatest`. Decide the mapping here, in one place, with `processable_action?` and `action_signature` reading the same spelling, and record it at `extract_action`.
- [ ] **`extract_action`**: `(data["action"].presence || :receive).to_sym`. An empty or blank action dispatches `receive` (`base_test.rb:167`). Use `presence`, not `||`.
- [ ] **`processable_action?` returns nil, not false, when rejected** (`… unless subscription_rejected?`). It is only tested for truthiness.
- [ ] **`method(action).arity == 1`** decides whether `data` is passed. `def speak(data)` has arity 1; `def speak(data = {})` has arity -1 and is called with no argument; `def speak(*args)` likewise. Use ruby-compat's `Method#arity` (`packages/ruby-compat/src/method.ts:62`), not `fn.length`: `length` stops counting at the first defaulted parameter and ignores a rest parameter, so it cannot tell `(data, extra = 1)` (Ruby arity -2) from `(data)` (arity 1).
- [ ] **`public_send action`** is `rbFPublicSend`.
- [ ] **`rescue Exception => exception; rescue_with_handler(exception) || raise`**: an unhandled error re-raises out of `dispatch_action` and so out of the `instrument` block. Await the action inside the `begin`.
- [ ] **`subscribe_to_channel` order**: run the `subscribe` callbacks around `subscribed`; then `reject_subscription if subscription_rejected?`; then `ensure_confirmation_sent`. A `before_subscribe` that calls `reject` still lets the chain finish.
- [ ] **The confirmation counter starts at 1** (`AtomicFixnum.new(1)`). `ensure_confirmation_sent` returns early when rejected, decrements, and transmits only when the counter is no longer positive. Each `stream_from` increments.
- [ ] **`@subscription_confirmation_sent = true` is set inside the instrument block**, after the transmit.
- [ ] **`reject_subscription` removes the subscription first** (`connection.subscriptions.remove_subscription self`, which runs `unsubscribe_from_channel`), then transmits the rejection.
- [ ] **`delegate_connection_identifiers` defines singleton methods** on the channel instance for each `connection.identifiers` entry, each calling `connection.send(identifier)`. They are own properties of the instance, and must not become actions.
- [ ] **`action_signature`**: `data.except("action")`, filtered through `ActiveSupport::ParameterFilter.new(connection.config.filter_parameters)`, appended as `(#{arguments.inspect})` only when non-empty. `base_test.rb:108` asserts the filtered log line, which is Ruby `inspect` of a Hash with String keys.
- [ ] **`transmit` payloads**: `connection.transmit identifier: @identifier, message: data`, and `type:` for confirmation and rejection. Key order is asserted by the tests that compare encoded JSON.
- [ ] **`data.inspect.truncate(300)`** is inside a `logger.debug do … end` block.
- [ ] **`params = {}` default** and `Subscriptions#add` passing an indifferent-access hash: `params[:id]` and `params["id"]` both read in tests.

## Acceptance criteria

- [ ] `base.rb` reads complete in `parity:api`; every private Rails method is `private` or `protected` with `@internal`.
- [ ] `Channel.Base` is seated on the namespace and `run_load_hooks(:action_cable_channel)` fires with it.
- [ ] A `.trails.test.ts` covers the four `action_methods` shapes, the arity rule for the three signatures above, and an async `subscribed` finishing before the confirmation is transmitted.

## Definition of done

Treating every prototype method as an action, or `fn.length === 1` for the arity rule, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/base.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
