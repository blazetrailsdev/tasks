---
title: "activerecord: Deduplicable, TimeZoneConverter and LockingType new overrides are constructors"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activerecord"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 200
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

- `ActiveRecord::ConnectionAdapters::Deduplicable::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:13`)
- `ActiveRecord::AttributeMethods::TimeZoneConversion::TimeZoneConverter.new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:9`)
- `ActiveRecord::Locking::LockingType.new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/optimistic.rb:207`)

`Deduplicable::ClassMethods#new` is a `ClassMethods#new` defined in `deduplicable.rb`, a different file from the `Column` and `TypeMetadata` classes that include `Deduplicable`: inlined at the head of each constructor and tagged. The other two are the class's own `self.new`: direct ports, no tag. `Inheritance::ClassMethods#new` (`inheritance.rb:56`) is not in this story; `activerecord-core-initialize-is-bases-constructor` owns it and `Base`'s tag order.

How each is ported today has not been read. Several are factories that return an object other than a fresh instance, and some may be ported as a static factory under another name.

## Acceptance criteria

- Each listed override that is ported is the first segment of its class's constructor, with no static `new` and no factory under another name standing in for it.
- A `ClassMethods#new` whose `def` is in a different Ruby file carries `@inlinedFrom`; own `self.new` constructors and same-file bodies carry no tag and are credited by the convention.
- Where the Rails body returns a different object, the constructor returns it.
- An override on something that is not a class in trails is handled as RFC Open question 2 says, and the PR body names the shape chosen.
- An override in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
