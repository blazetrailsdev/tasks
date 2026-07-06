---
title: "acceptance/confirmation use validator setupBang via validatesWith (drop helper attribute() decls)"
status: claimed
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: "2026-07-06T17:38:54Z"
assignee: "acceptance-confirmation-setup-bang-via-validates-with"
blocked-by: null
---

## Context

In PR #4285 the `validatesAcceptanceOf` / `validatesConfirmationOf` helpers
materialize their virtual attributes by calling `this.attribute(attr, "string",
{ virtual: true })` before delegating to `validatesWith`, rather than Rails'
mechanism where `AcceptanceValidator#initialize` / `ConfirmationValidator#initialize`
call `setup!(options[:class])` to lazily `attr_reader`/`attr_writer` the virtual
accessors (`activemodel/lib/active_model/validations/acceptance.rb:18-22`,
`confirmation.rb:21-29`).

The `setupBang` ports of `setup!` already exist
(`packages/activemodel/src/validations/{acceptance,confirmation}.ts`) and install
prototype accessors, but they are NOT wired into `validatesWith`. They can't be:
trails' Model constructor mass-assigns via `writeAttribute` directly, not through
prototype setters (the `_assign_attribute` setter-dispatch path), so a prototype
`attr_writer`-style accessor is bypassed at construction. Declaring a real virtual
attribute is the only mechanism the constructor honors today — which is why the
helper mirrors the existing `validates` DSL (`model.ts` `if (rules.acceptance)` /
`if (rules.confirmation)`).

This deviation is gated on RFC 0046 (constructor setter-dispatch convergence,
`converge-construction-unknown-attribute-strict`): once the constructor routes
mass-assignment through setters like Rails' `assign_attributes`, the faithful
path is to inject `options[:class]` in `validatesWith` and call the validator's
`setupBang`, dropping the helper-side `attribute()` declarations.

## Acceptance criteria

- After RFC 0046's constructor setter-dispatch lands, `validatesWith` injects the
  host class and invokes `setupBang` for validators that define it (Acceptance /
  Confirmation), mirroring Rails' `validates_with options[:class] = self` →
  validator `initialize` → `setup!`.
- `validatesAcceptanceOf` / `validatesConfirmationOf` drop the helper-side
  `attribute()` declarations and rely on the validator `setupBang` accessors.
- The `validates` DSL acceptance/confirmation path converges to the same
  mechanism (no duplicate attribute-declaration logic).
- Existing acceptance/confirmation tests stay green (constructor accepts
  `passwordConfirmation` etc. via the setupBang accessors).

## Out of scope

- The constructor setter-dispatch change itself (RFC 0046).
