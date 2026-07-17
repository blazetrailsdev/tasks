---
title: "validatesWith strict callback wrapper diverges from Rails errors.add strict-raise"
status: ready
updated: 2026-07-17
rfc: "0023-surfaced-deviations"
cluster: null
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

`Model.validatesWith` (packages/activemodel/src/model.ts, the `if (isStrict)`
branch) wraps each validator in a trails-invented callback that swaps in a
temp `Errors`, runs `validator.validate`, and then throws
`StrictValidationFailed` with all `tempErrors.fullMessages` joined. Rails has
no such wrapper: `validates_with` just registers the validator, and strict is
raised inside `ActiveModel::Errors#add` when the validator forwards
`options[:strict]` (activemodel/lib/active_model/errors.rb `add` →
`raise options[:strict]`). trails already mirrors that raise in
`errors.ts:249-254`, and `filteredErrorOptions` deliberately keeps `strict`
(validator.ts:24-31) so built-in validators forward it.

As of PR #4923, `validatesWith` now forwards the full options (including
`strict`) into the validator constructor, so `errors.add` raises first for any
validator that forwards its options — making the wrapper redundant on that
path. The wrapper now only fires for validators that add errors WITHOUT
forwarding `strict` (e.g. a custom `record.errors.add(:base, "msg")`). This is
a behavioral divergence: Rails raises on the FIRST strict error via
`errors.add`; the trails wrapper collects all errors then raises a single
joined message.

## Acceptance criteria

- Converge strict handling in `validatesWith` onto Rails' mechanism: rely on
  `errors.add`'s `strict`-raise rather than the temp-errors callback wrapper,
  or justify (with Rails `file:line`) why the wrapper must stay for the
  non-forwarding custom-validator case.
- If the wrapper is removed, verify strict validators still raise
  `StrictValidationFailed` (and custom exception classes via `strict: SomeError`)
  across the `validates(..., strict: true)` DSL, `validatesBang`, and direct
  `validatesWith(V, { strict: true })` paths.
- Existing strict tests stay green (validations.test.ts, errors.test.ts,
  presence-validation.test.ts strict cases).

## Out of scope

- The acceptance/confirmation setupBang wiring (PR #4923, done).
