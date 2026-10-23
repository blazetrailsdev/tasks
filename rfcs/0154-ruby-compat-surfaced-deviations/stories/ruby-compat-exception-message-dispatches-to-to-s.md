---
title: "Thor, SQLite3 and I18n errors drop hand-rolled message/to_s pairs onto Exception#message"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "trailties"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Exception#message` is `rb_funcallv(exc, idTo_s, 0, 0)` (`exc_message`,
`vendor/ruby/v3.3.11/error.c:3303`), so a class that overrides `to_s` changes
what `message` answers. `Thor::Correctable#to_s`
(`vendor/thor/v1.3.2/lib/thor/error.rb:4-6`) relies on it:
`super + DidYouMean.formatter.message_for(corrections)` makes `error.message`
carry the "Did you mean?" suffix.

The ruby-compat half has landed: trails#9022 gave `Exception` a `toS`
(`exc_to_s`) and a `message` getter that calls `this.toS()`
(`packages/ruby-compat/src/exception.ts:37-66`). A subclass that overrides
`toS` now changes `message`, as in Ruby.

The hand-rolled pairs written before that remain:

- `Thor::Error` (`packages/trailties/src/thor/error.ts:22-40`): a constructor
  that moves the message into a private field and deletes the own `message`,
  a `message` getter returning `this.toString()`, and a `toString`, each
  receipted `@noRailsEquivalent CONVERGEABLE ruby-compat-exception-message-dispatches-to-to-s`.
  Thor's local `Correctable` (`:9-20`) overrides `toString` and takes `super_`
  as a parameter.
- `SQLite3::Exception` (`packages/activerecord/src/sqlite/errors.ts:15-21`):
  the same private-field / delete / `get message()` pair.
- `I18n::MissingTranslation::Base` (`packages/i18n/src/exceptions.ts:100`):
  a `get message()` where the gem defines `message` / `to_s`
  (`vendor/i18n/v1.14.8/lib/i18n/exceptions.rb`).

## Acceptance criteria

- [ ] `Thor::Error` drops its constructor, `message` getter and `toString`, and
      `Correctable` overrides `toS` (Ruby's `to_s`) calling the next `toS`, so
      `error.message` carries the suffix through ruby-compat's getter. The
      three receipts are deleted. `error.trails.test.ts` stays green.
- [ ] `SQLite3::Exception` and `I18n::MissingTranslation::Base` are each
      checked against their Ruby source: a `to_s` override becomes `toS` with
      no private-field / delete pair; a genuine `message` override stays.
- [ ] Tests that read `String(error)` / `` `${error}` `` on a converted class
      are checked for the JS `"Name: message"` form.
