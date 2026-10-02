---
title: "Port Channel::Naming and Channel::Broadcasting"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps:
  ["actioncable-class-names-round-trip-through-constantize", "port-actioncable-server-broadcasting"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/naming.rb` (28 lines) and `channel/broadcasting.rb` (50),
Tier 1. Both are `ActiveSupport::Concern`s that `Channel::Base` includes.
Their Rails tests subclass `Channel::Base` and are ported in
`port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests`.

- `Naming::ClassMethods#channel_name` (`naming.rb:18-20`):
  `@channel_name ||= name.delete_suffix("Channel").gsub("::", ":").underscore`,
  and the instance `channel_name` delegating to the class (`:23-25`).
- `Broadcasting::ClassMethods#broadcast_to(model, message)`
  (`broadcasting.rb:14-16`): `ActionCable.server.broadcast(broadcasting_for(model), message)`.
- `broadcasting_for(model)` (`:24-26`):
  `serialize_broadcasting([ channel_name, model ])`.
- Private `serialize_broadcasting(object)` (`:29-38`): an Array is mapped
  recursively and joined with `":"`; an object responding to
  `to_gid_param` uses it; anything else uses `to_param`.
- Instance `broadcasting_for` and `broadcast_to` delegate to the class
  (`:41-47`).

Port the class-method halves with `extend()` / `Extended<>` and the instance
halves with `include()` / `Included<>` (CLAUDE.md § "Module mixins").

**Async.** `broadcast_to`, class and instance, returns the promise
`ActionCable.server.broadcast` returns.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/naming.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/broadcasting.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`name` is the Ruby constant path**, read through the reader `actioncable-class-names-round-trip-through-constantize` settled. `Chat::AppearancesChannel` is `"chat:appearances"`.
- [ ] **`delete_suffix("Channel")` removes one trailing occurrence only**; `ChannelChannel` is `"channel"`.
- [ ] **`@channel_name ||=` is per class.** A subclass must not answer its parent's memo: use the own-property guard.
- [ ] **`case` with no subject** tests the arms in order: Array first, then `respond_to?(:to_gid_param)`, then `to_param`. An Array that also answered `to_gid_param` would still take the Array arm.
- [ ] **`respond_to?(:to_gid_param)`** is `rbObjRespondTo`. A String does not respond to it and falls to `to_param`, which returns the string.
- [ ] **`to_param` on `nil` is `nil`**, and `["chat", nil].join(":")` is `"chat:"`. Rails' `toParam` is at `packages/activesupport/src/hash-utils.ts:412`.
- [ ] **No `@blazetrails/globalid` import.** The method is duck-typed.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`, with `serialize_broadcasting` private.
- [ ] A `.trails.test.ts` on a minimal host covers a namespaced class, the subclass memo, a nested array, a GlobalID-answering object and a plain string.

## Definition of done

`static channelName = …` hand-assigned on `Channel.Base` in place of the `extend()` does not close this story.
