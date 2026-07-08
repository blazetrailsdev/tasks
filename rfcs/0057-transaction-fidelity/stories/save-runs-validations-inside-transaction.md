---
title: "save-runs-validations-inside-transaction"
status: blocked
updated: 2026-07-08
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: ["0063-async-validation-chain"]
est-loc: null
priority: 17
pr: null
claim: null
assignee: null
blocked-by: "flip-activerecord-isvalid-async"
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

### Now unblocked in principle — sequenced after the async flip (RFC 0063)

The old governing constraint was the strict-sync validation chain
(`validations.ts#isValid` returned a `boolean`, never a `Promise`), which forced
the async `before_validation` body to be deferred out of the sync `valid?` pass
into `_beforeValidationSideEffects`. **RFC 0063-async-validation-chain reverses
that sync-only decision** (decision reversed 2026-07-06): `isValid`/`validate`
become async and the validate callback chain accepts async callbacks like the
save chain already does.

Once `flip-activerecord-isvalid-async` lands on `main`, an async
`before_validation` can run and `throw :abort` **inside** the validation chain,
so the `_beforeValidationSideEffects` deferral is no longer needed and the
before_validation-before-validators ordering is reproducible natively. This story
is therefore **blocked-by `flip-activerecord-isvalid-async`** (RFC 0063 rollout),
not blocked-on-an-undecided-architecture. It is genuine convergence — NOT a
documentation/baseline entry. (An earlier attempt, closed PR #4713, shipped a
tracked-pending-convergence doc entry plus a green regression-lock asserting the
divergent order; that ratifies the deviation and was closed unmerged. Do not
revive that approach — converge the behavior.)

## Acceptance criteria

- [ ] Move `performValidations` inside `withTransactionReturningStatus` so the
      full validation pass — `before_validation` callbacks THEN the validators —
      runs inside the save transaction, with `before_validation` firing before
      the validators, matching Rails' `Transactions#save {
    with_transaction_returning_status { Validations#save {
    perform_validations; Persistence#save } } }` module layering
      (transactions.rb:360, validations.rb:47).
- [ ] Delete the `_beforeValidationSideEffects` queue workaround introduced by
      PR #4264 and the canonical Topic wiring that feeds it
      (`test-helpers/models/topic.ts`) — the async `before_validation` now runs
      inline in the (async) validation chain. Remove the "ORDERING DEVIATION"
      comment at the drain site in `persistence.ts`.
- [ ] Un-skip / port the test asserting that an aborting async
      `before_validation` on a record with an otherwise-failing validation
      reports **no** errors (Rails order). Match the Rails test name if one
      exists; delete any green regression-lock that asserts the divergent order.
- [ ] The four existing cancellation tests in `transactions.test.ts`
      (validation/save × save/save!) still pass with the async before_validation
      running inline rather than via the deferred queue.
- [ ] Remove the tracked-pending-convergence entry for this deviation from
      `packages/website/docs/guides/activerecord-rails-deviations.md` if one was
      added — the deviation is fixed, not tracked.
