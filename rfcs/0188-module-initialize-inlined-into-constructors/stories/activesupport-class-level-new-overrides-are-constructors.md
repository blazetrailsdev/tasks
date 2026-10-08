---
title: "activesupport: DeprecationProxy, TimeZone, Subscribers and TaggedLogging new overrides are constructors"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activesupport"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC § Design, rules 3 and 4. A class's own `def self.new` is the constructor: a direct port with no tag, whose `super` is the rest of the constructor. A `new` defined on a `ClassMethods` module the class extends is inlined at the head of the constructor, and tagged `@inlinedFrom` when its `def` is in a different Ruby file. JS has only the `new` expression (trails CLAUDE.md § "A record is built with `new Klass` only").

Rails definitions in scope, from `rails-api.json`:

- `ActiveSupport::Deprecation::DeprecationProxy.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:6`)
- `ActiveSupport::Deprecation::DeprecatedConstantProxy.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:121`)
- `ActiveSupport::TimeZone.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/values/time_zone.rb:216`)
- `ActiveSupport::Notifications::Fanout::Subscribers.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/notifications/fanout.rb:319`)
- `ActiveSupport::TaggedLogging.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb:121`)

All five are a module's or class's own `self.new`: direct ports, no tag. `TimeZone.new` answers from a cache and `TaggedLogging.new` returns an extended logger, so the constructor returns that object. `Fanout::Subscribers.new` is a module-level `new` (RFC Open question 2): record the shape chosen in the PR body.

How each is ported today has not been read. Several are factories that return an object other than a fresh instance, and some may be ported as a static factory under another name.

## Acceptance criteria

- Each listed override that is ported is the first segment of its class's constructor, with no static `new` and no factory under another name standing in for it.
- A `ClassMethods#new` whose `def` is in a different Ruby file carries `@inlinedFrom`; own `self.new` constructors and same-file bodies carry no tag and are credited by the convention.
- Where the Rails body returns a different object, the constructor returns it.
- An override on something that is not a class in trails is handled as RFC Open question 2 says, and the PR body names the shape chosen.
- An override in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
