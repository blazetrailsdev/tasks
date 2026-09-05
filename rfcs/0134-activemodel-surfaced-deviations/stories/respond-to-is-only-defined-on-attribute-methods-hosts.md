---
title: "respond-to-is-only-defined-on-attribute-methods-hosts"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `respond_to?` is `Object#respond_to?`, so every ActiveModel object answers
it; `ActiveModel::AttributeMethods#respond_to?`
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:528`)
is an _override_ that adds the dynamic-attribute arm on top of `super`.

trails has only the override. `respondTo` is defined once, on the
`AttributeMethods` module
(`packages/activemodel/src/attribute-methods.ts:486`), so a model that does not
`include(this, AttributeMethods)` has no `respondTo` at all.

`Conversion#toKey` (`packages/activemodel/src/conversion.ts:39-43`, Rails'
`activemodel/lib/active_model/conversion.rb:44-47`) calls
`self.respondTo("id")` unconditionally, so a plain `Model` subclass throws
`TypeError: self.respondTo is not a function` from `toKey` / `toParam`.

Surfaced by porting `vendor/rails/activemodel/test/models/contact.rb` to
`packages/activemodel/src/test-helpers/models/contact.ts`, whose Ruby original
includes `Conversion` and `Validations` but NOT `AttributeMethods`. The
workaround shipped there is a `respondTo` on that model, spelling out the
`Object#respond_to?` default so `toKey` can run. It carries NO
`@noRailsEquivalent` receipt: `test-helpers/**` is outside the measured surface,
so a tag there has nothing backing it and `extra-surface.ts` reports it as a
STALE tag (it did, on PR #7533). This story is the record instead.

## Acceptance criteria

- Ruby's `Object#respond_to?` has a home outside `activemodel` — the natural one
  is `ruby-compat` — and `AttributeMethods#respondTo` reads as the override it
  is in Rails, delegating to that default instead of standing alone
  (its `@missingRailsCall super — PERMANENT` at `attribute-methods.ts:484`
  retires with it).
- The `respondTo` on `test-helpers/models/contact.ts` is deleted.
- `conversion.test.ts` (which exercises `toKey` / `toParam` on a plain
  `Contact`) stays green.
