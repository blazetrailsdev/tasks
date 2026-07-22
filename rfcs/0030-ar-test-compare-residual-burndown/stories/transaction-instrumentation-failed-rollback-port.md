---
title: "transaction-instrumentation-failed-rollback-port"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (2026-07-22) reports 2 missing tests in
`transaction-instrumentation.test.ts`:

- transaction instrumentation on failed rollback
  (vendor/rails/activerecord/test/cases/transaction_instrumentation_test.rb:392)
- transaction instrumentation on failed rollback when unmaterialized (:416)

Both stub the connection's rollback to raise and assert the
`transaction.active_record` notification payload reports an errored outcome.
trails file: `packages/activerecord/src/transaction-instrumentation.test.ts`
(tests absent).

## Acceptance criteria

- [ ] Both tests ported (names verbatim) and matched in `test:compare`, or
      it.skip with a BLOCKED/ROOT-CAUSE tag + follow-up story if the
      instrumentation payload path has a real gap.
- [ ] transaction-instrumentation.test.ts missing count drops to 0.
