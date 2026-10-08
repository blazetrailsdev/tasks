---
title: "class-level new overrides are the constructor: own self.new ported directly, ClassMethods#new inlined and tagged"
status: draft
updated: 2026-10-08
rfc: "0000-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activerecord", "activesupport", "actionpack", "actionview", "rack-test", "did-you-mean"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC § Design, rules 3 and 4. A class's own `def self.new` is the
constructor: a direct port with no tag, whose `super` is the rest of the
constructor. A `new` defined on a `ClassMethods` module the class extends is
owned by a different Ruby module, so it is inlined at the head of the
constructor and tagged `@inlinedFrom`. Three of the thirteen below are that
second kind: the two `ClassMethods#new` in activerecord and the one in
actionview. JS has only the `new` expression (trails CLAUDE.md § "A record is
built with `new Klass` only").

Rails definitions in scope, from `rails-api.json`:

- `ActiveRecord::Inheritance::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56`)
- `ActiveRecord::ConnectionAdapters::Deduplicable::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:13`)
- `ActiveRecord::AttributeMethods::TimeZoneConversion::TimeZoneConverter.new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:9`)
- `ActiveRecord::Locking::LockingType.new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/optimistic.rb:207`)
- `ActiveSupport::Deprecation::DeprecationProxy.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:6`)
- `ActiveSupport::Deprecation::DeprecatedConstantProxy.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:121`)
- `ActiveSupport::TimeZone.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/values/time_zone.rb:216`)
- `ActiveSupport::Notifications::Fanout::Subscribers.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/notifications/fanout.rb:319`)
- `ActiveSupport::TaggedLogging.new` (`vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb:121`)
- `ActionDispatch::Flash.new` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/flash.rb:312`)
- `ActionView::TestCase::Behavior::ClassMethods#new` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb:187`)
- `Rack::Test::Session.new` (`vendor/rack-test/v2.2.0/lib/rack/test.rb:57`)
- `DidYouMean.new` (`vendor/did_you_mean/v1.6.3/lib/did_you_mean/spell_checkers/name_error_checkers.rb:6`)

How each is ported today has not been read. Several are factories that return
an object other than a fresh instance (a cached zone, an extended logger, a
middleware, a module); some may be ported as a static factory under another
name, and `action_view/test_case.rb` is unported as of 2026-10-08.

## Acceptance criteria

- Each listed override that is ported is the first segment of its class's
  constructor, with no static `new` and no factory under another name standing
  in for it.
- The `ClassMethods#new` constructors carry `@inlinedFrom` where the `def` is in another Ruby file; the ten own
  `self.new` constructors carry no tag and are credited by the `Klass.new`
  convention.
- Where the Rails body returns a different object, the constructor returns it.
- `Base`'s constructor carries the `Inheritance::ClassMethods#new` tag first,
  ahead of the `initialize` tags; coordinate with
  `activerecord-core-initialize-is-bases-constructor` on which PR adds it.
- An override on a module that is not a class in trails (a module-level `new`
  such as `Fanout::Subscribers.new` or `DidYouMean.new`) is named in the PR
  body with the shape chosen for it, or filed if it needs a decision.
- An override in an unported file is left alone and named in the PR body.
- If the list exceeds one PR, it is split per package by filing stories.
- A `ClassMethods#new` defined in the same Ruby file as the class that extends it carries no tag; `ActionView::TestCase::Behavior::ClassMethods#new` looks like that case and is to be checked.
