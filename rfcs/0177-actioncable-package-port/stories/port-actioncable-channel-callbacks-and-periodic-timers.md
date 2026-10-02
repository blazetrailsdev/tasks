---
title: "Port Channel::Callbacks and Channel::PeriodicTimers"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-namespace-and-internal-constants"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/callbacks.rb` (76 lines) and `channel/periodic_timers.rb`
(78), Tier 1. Their Rails coverage is in `channel/base_test.rb` and
`channel/periodic_timers_test.rb`, ported after `Channel::Base`.

`Callbacks` (`callbacks.rb:38-74`): `include ActiveSupport::Callbacks`;
`included do define_callbacks :subscribe; define_callbacks :unsubscribe end`;
class methods `before_subscribe`, `after_subscribe`, `before_unsubscribe`,
`after_unsubscribe`, and the two `alias_method`s `on_subscribe` and
`on_unsubscribe`.

`PeriodicTimers` (`periodic_timers.rb:7-76`):

- `included do`: `class_attribute :periodic_timers, instance_reader: false,
default: []`, `after_subscribe :start_periodic_timers`,
  `after_unsubscribe :stop_periodic_timers`.
- `periodically(callback_or_method_name = nil, every:, &block)` (`:31-52`),
  with three `ArgumentError`s.
- Private `active_periodic_timers`, `start_periodic_timers`,
  `start_periodic_timer(callback, every:)`, `stop_periodic_timers`
  (`:56-75`).

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/callbacks.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/periodic_timers.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`on_subscribe` is `alias_method :on_subscribe, :after_subscribe`**, not a second definition. Port it as an alias so a subclass overriding `after_subscribe` behaves as in Ruby (the alias keeps the original).
- [ ] **`periodically`'s three errors and their order**: block and arg together ("Pass a block or provide a callback arg, not both"); arg neither Proc nor Symbol ("Expected a Symbol method name or a Proc, got #{inspect}"); then `every` not a positive Numeric ("Expected every: to be a positive number of seconds, got #{inspect}"). Messages use Ruby `inspect`.
- [ ] **A String method name is rejected.** The `case` has `when Proc` and `when Symbol` only, and `periodic_timers_test.rb:57-64` asserts `"send_updates"`, `Object.new` and `nil` all raise. In trails a Ruby Symbol is a string, so `periodically("sendUpdates", …)` is the Symbol arm; decide how the test's String case is expressed and say so at the `case`.
- [ ] **`every.kind_of?(Numeric) && every > 0`**: the test passes `0`, `0.0`, `0.seconds`, `-1`, `-1.seconds`, `"foo"`, `:foo` and `Object.new`. `0.seconds` is an `ActiveSupport::Duration`, which answers `kind_of?(Numeric)` through `Duration#is_a?`; `1.second` must be accepted.
- [ ] **`self.periodic_timers += [[ callback, every: every ]]`** builds a new array, so a subclass's timers do not leak into the parent. Use `classAttribute()`; do not push onto the inherited array.
- [ ] **Each entry is `[callback, { every: }]`** and `start_periodic_timers` reads `options.fetch(:every)`. The Rails test asserts `timer[1][:every]`.
- [ ] **`-> { __send__ callback_or_method_name }`** is later run with `instance_exec` on the channel, so `self` is the channel and the method may be private.
- [ ] **`start_periodic_timer`** calls `connection.server.event_loop.timer(every)` and, inside it, `connection.worker_pool.async_exec self, connection: connection, &callback`.
- [ ] **`stop_periodic_timers` calls `shutdown` on each and then `clear`s** the same array.
- [ ] **`instance_reader: false`**: an instance does not answer `periodic_timers`.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`.
- [ ] A `.trails.test.ts` on a minimal host covers the alias, the three errors with their messages, subclass isolation of `periodic_timers`, and start/stop against a recording event loop.

## Definition of done

Accepting any truthy `every`, or a shared mutable `periodicTimers` array, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/channel/callbacks.trails.test.ts packages/actioncable/src/channel/periodic-timers.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
