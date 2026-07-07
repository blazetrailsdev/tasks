---
title: "save-runs-validations-inside-transaction"
status: in-progress
updated: 2026-07-07
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: 4713
claim: "2026-07-07T00:13:02Z"
assignee: "save-runs-validations-inside-transaction"
blocked-by: null
---

## Context

Surfaced by PR #4264 (`before-filter-db-side-effect-cancellation`). Rails layers
save as `Transactions#save { with_transaction_returning_status {
Validations#save { perform_validations; Persistence#save { create_or_update } } } }`
(transactions.rb:360-361, validations.rb:47-48), so the entire validation pass —
`before_validation` callbacks AND the validators (`valid?`) — runs _inside_ the
save transaction, with `before_validation` firing _before_ `valid?`.

trails diverges: `save` (`packages/activerecord/src/persistence.ts`) calls
`performValidations` (and `_runAsyncValidations`) **outside**
`withTransactionReturningStatus`. PR #4264 worked around this for the cancelling
`before_validation` case by deferring the filter's async body into a per-instance
`_beforeValidationSideEffects` queue that `save` drains _inside_ the transaction —
but that drain runs _after_ the validators, inverting Rails' order.

Observable deviation: a record with BOTH a failing validation AND an aborting
async `before_validation` reports `errors.any == true` in trails (validators ran
first) where Rails reports no errors (the `throw :abort` halts before `valid?`
runs). The four cancellation tests in `transactions.test.ts` don't hit this
(their validations pass). Documented inline at the drain site in
`persistence.ts` ("ORDERING DEVIATION").

The governing constraint is the architecturally-mandated strict-sync validation
chain (`validations.ts#isValid` returns a boolean, never a Promise — same
constraint behind `async-validations-honor-validation-context` and the
deferred-uniqueness `_asyncValidations` path). Full convergence means moving
`performValidations` inside the transaction so before_validation + validators run
inside it in Rails order. That is blocked-on-architecture: it ripples through
every synchronous `isValid`/`valid?` caller and interacts with the deferred
async-validation drain. This is NOT a wontfix — it is gated on the sync-only
validation decision being revisited.

## Acceptance criteria

- [ ] Move `performValidations` (and the deferred async-validation / before_validation
      side-effect drain) inside `withTransactionReturningStatus` so the full
      validation pass runs inside the save transaction, with `before_validation`
      firing before the validators — matching Rails' module layering.
- [ ] Remove the `_beforeValidationSideEffects` queue workaround introduced by
      PR #4264 once before_validation runs inside the transaction natively (or
      keep it only as the sync-chain async bridge if still required).
- [ ] Add/port a test asserting that an aborting async `before_validation` on a
      record with an otherwise-failing validation reports no errors (Rails order),
      matching the Rails test name if one exists.
- [ ] If full convergence stays blocked on the sync-only architecture, record a
      justified tracked-pending-convergence baseline entry instead of a wontfix.
