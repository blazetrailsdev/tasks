---
title: "validations-test-body-rails-fidelity"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from PR #4317 (schema convergence of `validations.test.ts` onto the
canonical `topics` table). A Codex review found four ValidationsTest tests whose
**bodies** are synthetic and do not reproduce Rails' actual semantics. These
divergences pre-date #4317 (the original bodies were equally synthetic); #4317
only converged the schema. Porting the bodies to the real Rails models is a
distinct fidelity task tracked here.

`packages/activerecord/src/validations.test.ts`:

1. `"numericality validation with mutation"` — Rails (`validations_test.rb:169`)
   defines a string `wibble`, `validates_numericality_of :wibble, only_integer: true`,
   mutates `"123-4567"` via `gsub!`, then asserts validity (re-reading the mutated
   raw value). Current body just creates a persisted Topic with integer
   `replies_count` and checks the getter — no mutation, no raw-value re-read.

2. `"numericality validation checks against raw value"` — Rails
   (`validations_test.rb:181`) uses `attribute :wibble, :decimal, scale: 2,
precision: 9` with `greater_than_or_equal_to: BigDecimal("97.18")`, asserting
   `97.18` passes and `97.17` fails (rounded raw vs cast). Current integer
   `replies_count` getter assertion can't catch the raw-vs-cast edge.

3. `"numericality validates raw input when attribute came from user ..."` /
   cast-value sibling — Rails (`validations_test.rb:203`,
   `models/price_estimate.rb:3`) uses `PriceEstimate`, whose `price` getter returns
   formatted currency while `price_before_type_cast`/`read_attribute(:price)` stay
   numeric, validating before and after `save!` as `price_came_from_user?` flips.
   Current body has no custom getter and never persists, so it can't prove the
   validator bypasses the getter or handles the came-from-user transition.

4. `"valid uses create context when new"` / `"... update context when persisted"`
   — Rails (`validations_test.rb:19`, `models/reply.rb:39`) is about `WrongReply`
   custom validators adding `"is Wrong Create"` on `:create` and `"is Wrong Update"`
   on `:update` to `title`. Current presence validators on `group`/`content` only
   prove generic context-skipping and miss the error attribute/message behavior the
   tests are named after.

## Acceptance criteria

- Port each body to the real Rails model/attribute (`PriceEstimate`, `WrongReply`,
  virtual decimal/string `wibble`), using canonical models/columns only (no bespoke
  schema). Add `PriceEstimate`/`WrongReply` canonical models if missing.
- Assertions match the Rails semantics (mutation re-read, decimal raw-vs-cast,
  came-from-user transition, `:create`/`:update` custom-validator messages).
- Test names match Rails verbatim. Passes on sqlite/postgres/maria. <500 LOC.
