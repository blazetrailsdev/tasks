---
title: "ruby-compat: Exception's own message property shadows the to_s-dispatching message getter"
status: draft
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Exception#message` is `rb_funcallv(exc, idTo_s, 0, 0)` (`exc_message`, `vendor/ruby/v3.3.11/error.c:3303`), and `exc_to_s` (`error.c:1463`) reads the `mesg` ivar `exc_initialize` (`error.c:1386`) sets.

ruby-compat defines a `message` getter on `Exception.prototype` that calls `this.toS()` (`packages/ruby-compat/lib/exception.ts`). But the native `Error` constructor seats a given message as an OWN `message` data property, and that property shadows the getter. So a subclass that overrides `toS` changes `message` only when it was built with no message. The prototype `message` setter also writes an own property, which shadows the getter again.

This was found working on trails#10773 (`ruby-compat-exception-message-dispatches-to-to-s`, released). The fix was tried there: `Exception`'s constructor moves an own `message` into a WeakMap `mesg` slot, `toS` reads the slot, and the setter writes the slot. activesupport, activemodel and i18n stayed green. It was backed out only for scope.

A naming conflict also blocks Thor's `Correctable#to_s` (`vendor/thor/v1.3.2/lib/thor/error.rb:4-6`). `docs/ruby-ts-conventions.md` maps Ruby `to_s` to `toString` (`scripts/parity/conventions.ts:2367`), while ruby-compat's base `exc_to_s` is `toS`:

- an override named `toS` is novel surface in thor, which is pinned at 0;
- an override named `toString` recurses through native `Error#toString`, which reads `message`.

## Acceptance criteria

- [ ] `Exception`'s constructor seats a given message in a `mesg` slot rather than an own `message` property, and the `message` setter writes that slot. A `toS` override then changes `message` whether or not a message was given.
- [ ] One spelling of `to_s` is decided for exception classes (`toS` admitted by the conventions table for Exception descendants, or `Exception.prototype.toString` as `exc_to_s`). After that, `Thor::Error` is `class Error < StandardError; end` with no constructor, getter or private field.
- [ ] `SQLite3::Exception` (`packages/sqlite3/lib/errors.ts`) extends `StandardError` and its `message` is `[super.message, sqlError()]`, as `vendor/sqlite3/v2.7.3/lib/sqlite3/errors.rb` has it.
