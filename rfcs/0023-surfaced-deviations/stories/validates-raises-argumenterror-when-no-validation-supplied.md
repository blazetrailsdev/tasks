---
title: "validates raises ArgumentError when no validation is supplied"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing PR #5192 (`save-through-record-uses-bang-save`).

A test registered a join-row validator as `(this as any).validates((r) => {
r.errors.add("base", "Join always invalid") })` — the block form, whose real
API is `validate(fn)`. Our `validates` silently registered **nothing**: the
test passed vacuously for as long as it existed, and only surfaced when the
bang-save change made the expected raise mandatory.

`validates` (`packages/activerecord/src/validations.ts:263`, and
ActiveModel's `Model.validates` at `packages/activemodel/src/model.ts:549`)
takes `(attribute, rules)`. Called with one argument, `rules` is `undefined`;
`{ ...undefined }` spreads to `{}`, every `if (arRules.x)` arm is skipped, and
the call returns having registered no validator at all.

Rails raises instead
(`vendor/rails/activemodel/lib/active_model/validations/validates.rb:116`):

```ruby
raise ArgumentError, "You need to supply at least one validation" if validations.empty?
```

No other caller currently passes a function (checked repo-wide), so this is a
latent footgun rather than an active bug — but it silently converts a
mis-typed validation into a no-op, which is exactly how the #5192 test rotted.

## Acceptance criteria

- [ ] `validates` raises `ArgumentError("You need to supply at least one
validation")` when no recognized validation rules remain, matching
      `validates.rb:116`. Cover both the AR override
      (`activerecord/src/validations.ts`) and ActiveModel's
      (`activemodel/src/model.ts`).
- [ ] Shared-only options (`on`/`if`/`unless`/`allowNil`/`allowBlank`) do not
      count as validations, per Rails' `_validates_default_keys` exclusion.
- [ ] Test covering the no-rules call and the mistaken block form
      `validates(fn)`.
- [ ] No existing caller regresses (repo-wide check showed none passing a
      function today).
