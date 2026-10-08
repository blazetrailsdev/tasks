---
title: "actionpack, actionview, rack-test and did-you-mean: Flash, TestCase, Rack::Test::Session and DidYouMean new overrides"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["actionpack", "actionview", "rack-test", "did-you-mean"]
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

- `ActionDispatch::Flash.new` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/flash.rb:312`)
- `ActionView::TestCase::Behavior::ClassMethods#new` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb:187`)
- `Rack::Test::Session.new` (`vendor/rack-test/v2.2.0/lib/rack/test.rb:57`)
- `DidYouMean.new` (`vendor/did_you_mean/v1.6.3/lib/did_you_mean/spell_checkers/name_error_checkers.rb:6`)

`ActionView::TestCase::Behavior::ClassMethods#new` is defined in `test_case.rb` alongside the `TestCase` that includes `Behavior` (`test_case.rb:447`): same file, so it is inlined at the head of `TestCase`'s constructor with no tag. The rest are the class's own `self.new`: direct ports, no tag. `DidYouMean::NameErrorCheckers.new` is a method on a plain object (`class << (NameErrorCheckers = Object.new)`), not a class: RFC Open question 2, record the shape chosen in the PR body. `action_view/test_case.rb` is unported as of 2026-10-08.

How each is ported today has not been read. Several are factories that return an object other than a fresh instance, and some may be ported as a static factory under another name.

## Acceptance criteria

- Each listed override that is ported is the first segment of its class's constructor, with no static `new` and no factory under another name standing in for it.
- A `ClassMethods#new` whose `def` is in a different Ruby file carries `@inlinedFrom`; own `self.new` constructors and same-file bodies carry no tag and are credited by the convention.
- Where the Rails body returns a different object, the constructor returns it.
- An override on something that is not a class in trails is handled as RFC Open question 2 says, and the PR body names the shape chosen.
- An override in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
