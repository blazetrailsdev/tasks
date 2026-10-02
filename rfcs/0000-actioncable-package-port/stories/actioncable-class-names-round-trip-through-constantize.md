---
title: "Channel and connection classes carry their Ruby constant names and resolve through constantize"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable", "activesupport"]
deps: ["port-actioncable-namespace-and-internal-constants"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Action Cable names classes by Ruby constant path in six places, and a JS
class's `name` is only its last segment:

- `Channel::Naming.channel_name` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/naming.rb:19`):
  `name.delete_suffix("Channel").gsub("::", ":").underscore`.
  `Chat::AppearancesChannel` is `"chat:appearances"`, and Rails' own test
  expects `"action_cable:channel:naming_test:chat"` for a class nested in
  the test class (`vendor/rails/v8.0.2/actioncable/test/channel/naming_test.rb:9`).
- `Connection::Subscriptions#add` (`connection/subscriptions.rb:39`):
  `id_options[:channel].safe_constantize`, on a string a browser sent.
- `Engine` (`engine.rb:55`):
  `"ApplicationCable::Connection".safe_constantize`.
- `Server::Configuration#pubsub_adapter` (`server/configuration.rb:66`):
  `"ActionCable::SubscriptionAdapter::#{adapter}".constantize`.
- `self.class.name` in log lines and in every instrumentation payload's
  `channel_class` (`channel/base.rb:179,227,232,311,326`), and in
  `Connection::Base#inspect` (`connection/base.rb:169`).
- `Channel::TestCase.tests` and `Connection::TestCase.tests`
  (`channel/test_case.rb:211`, `connection/test_case.rb:159`):
  `channel.to_s.camelize.constantize`, plus
  `determine_constant_from_test_name`.

trails' `constantize` (`packages/activesupport/src/inflector.ts:211`)
resolves registered names and namespace-seat walks; `rbModName`
(ruby-compat) reads the path a class was bound under.

This story settles how an Action Cable class gets its Ruby name and how the
six sites read it, so the lib stories do not each decide.
`0169/register-activejob-constants-for-class-name-round-trip` (draft) settles
the same question for jobs. Whichever lands first picks the mechanism and the
one Ruby-name reader; the other reuses it. Read that story's state before
starting.

## Fidelity traps (predicted at authoring)

- [ ] **`safe_constantize` on client input.** `add` then checks `ActionCable::Channel::Base > subscription_klass`, so a name that resolves to a non-channel logs "Subscription class not found". The lookup itself must not throw for a malformed name (`safe_`), and must not resolve arbitrary globals.
- [ ] **Anonymous and test-local classes.** `Class.new(ActionCable::Channel::Base)` has a nil name; `channel_name` then raises `NoMethodError` on `nil.delete_suffix`. Do not invent a fallback name.
- [ ] **`@channel_name ||=` is a class-level ivar memo.** A subclass must not read its parent's memo (CLAUDE.md § "`inherited` is deferred to own-property memo guards").
- [ ] **Namespaced file layout.** `app/channels/chat/appearances_channel.rb` defines `Chat::AppearancesChannel`. The eager scan in `eager-load-app-channels-in-finisher` registers under that name; this story defines the name reader it uses.

## Acceptance criteria

- [ ] One documented mechanism names an Action Cable class, shared with ActiveJob's if that story has landed.
- [ ] A `.trails.test.ts` proves a namespaced channel class reads its full Ruby name, resolves through `safeConstantize`, and that an unknown or malformed name answers `null`.
- [ ] No lib story after this one adds its own name registry.

## Definition of done

Deriving `channel_name` from the bare JS class name does not close this story.
