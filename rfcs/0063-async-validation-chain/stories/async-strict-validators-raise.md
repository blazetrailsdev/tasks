---
title: "async-strict-validators-raise"
status: done
updated: 2026-07-17
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4926
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Model.validatesWith` (activemodel/src/model.ts:773-789) implements
`strict: true` by wrapping the validate callback: it swaps in a temp
`Errors`, calls `validator.validate(r)`, and after the call checks
`tempErrors.any` to throw `StrictValidationFailed`. This works for
synchronous validators, but the AR/AM validation chain is now async
(RFC 0063): for a validator whose `validate` returns a Promise
(`UniquenessValidator`, `AssociatedValidator`, any async EachValidator),
`validate(r)` returns before it has added any error, `tempErrors.any` is
false, the temp errors is restored, and the awaited promise adds the
error to the _real_ errors instead. Result: `strict: true` on an async
validator adds the error but never raises `StrictValidationFailed`.

Rails instead treats strict as a plain error option:
`UniquenessValidator` builds `error_options = options.except(...)` (which
includes `:strict`) and `errors.add(attr, :taken, **error_options)`
raises via `Errors#add` when strict is set
(vendor/rails/activerecord/lib/active_record/validations/uniqueness.rb:47).

- activemodel/src/model.ts:773-789 — the sync-only strict wrapper.
- activerecord/src/validations/uniqueness.ts — `validateEach` already
  sets `errorOpts.strict = opts.strict` and would raise via `errors.add`,
  but `validatesWith` strips `strict` (model.ts:742) before constructing
  the validator, so `opts.strict` is undefined.

Discovered while porting uniqueness inline in
`uniqueness-inline-delete-deferred-registry` (#4926): uniqueness moved
from the deferred `_asyncValidations` registry (where strict DID raise
via errorOpts.strict) onto the normal `validatesWith` chain, exposing
this gap. No test currently covers strict uniqueness, so #4926 does not
regress any test, but the observable behavior changed from "raises" to
"adds error, no raise".

## Acceptance criteria

- `validates ..., uniqueness: true, strict: true` (and other async
  validators) raise `StrictValidationFailed` on failure, matching Rails.
- The strict mechanism awaits async validators (either the `validatesWith`
  wrapper awaits, or strict flows to `errors.add` as a plain option like
  Rails).
- Coverage: a strict async-validator test (uniqueness and/or associated)
  ported from / matching Rails behavior.
