---
title: "ruby-compat Exception#message does not dispatch to to_s (exc_message)"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Exception#message` is `rb_funcallv(exc, idTo_s, 0, 0)` (`vendor/ruby/v3.3.11/error.c`, `exc_message`), and `Exception#to_s` (`exc_to_s`) returns the stored `mesg`, or the class name when it is nil. So a class that overrides `to_s` changes what `message` answers. `Thor::Correctable#to_s` (`vendor/thor/v1.3.2/lib/thor/error.rb:4-6`) relies on it: `super + DidYouMean.formatter.message_for(corrections)` makes `error.message` carry the "Did you mean?" suffix.

ruby-compat's `Exception` (`packages/ruby-compat/src/exception.ts`) is a bare `class Exception extends Error {}`. A JS `Error` stores `message` as an own data property, and `Error.prototype.toString` answers `"Name: message"`, so an overridden `toString` never reaches `message`.

The thor port therefore carries the two methods on `Thor::Error` itself (`packages/trailties/src/thor/error.ts`): a constructor that moves the message into a private field and deletes the own `message` property, a `message` getter that returns `this.toString()`, and a `toString` that returns the stored message. Each carries `@noRailsEquivalent CONVERGEABLE ruby-compat-exception-message-dispatches-to-to-s`. `packages/activerecord/src/sqlite/errors.ts` (`SQLite3::Exception`) and `packages/i18n/src/exceptions.ts` (`MissingTranslationData`) hand-roll the same pair.

Related: `standard-error-message-does-not-default-to-class-name` (the nil-`mesg` arm of `exc_to_s`).

## Acceptance criteria

- ruby-compat's `Exception` answers `message` through `toString()`, and `toString()` answers the stored message, as `exc_message` / `exc_to_s` do.
- `Thor::Error` in `packages/trailties/src/thor/error.ts` drops its constructor, `message` getter and `toString`, and the three receipts go with them. `error.trails.test.ts` stays green.
- The whole suite is checked for tests that read `String(error)` or `` `${error}` `` on a ruby-compat `Exception` subclass and expect the JS `"Name: message"` form.
