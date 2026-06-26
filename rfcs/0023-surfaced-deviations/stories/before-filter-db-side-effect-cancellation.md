---
title: "Cancelling before-filter with a DB side effect rolls back transactionally"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converting `transactions.test.ts` (RFC 0019 `transactions-test-canonical`,
PR #4194). Rails defines four dynamic cancellation tests
(`test_cancellation_from_before_filters_rollbacks_in_{validation,save}{,!}`,
`vendor/rails/activerecord/test/cases/transactions_test.rb:714`) whose cancelling
before-filter performs a DB side effect (`Book.create`) then `throw(:abort)`, and
asserts BOTH the dirtied `author_name` reverts AND `Book.count` is rolled back.
trails can't run these faithfully: `before_validation` runs on the strict-sync
validation chain (no awaiting — see the `trails validations are sync-only`
constraint) and the canonical Topic `before_*_for_transaction` hook dispatch is
invoked without `await`, so an async `Book.create` in the filter can't be awaited
or transactionally rolled back. The four tests are `it.skip` faithful ports in
`transactions.test.ts`.

## Acceptance criteria

- [ ] A cancelling before-filter that performs a DB write then aborts rolls back
      the write transactionally (Book.count unchanged) and reverts in-memory dirty
      attributes, for both the validation and save filters.
- [ ] Un-skip the four `cancellation from before filters rollbacks in ...` tests.
