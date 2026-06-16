---
title: "old-config first-saved-instance commit callbacks + before_commit order"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two transaction-callbacks tests need the deprecated
`run_commit_callbacks_on_first_saved_instances_in_transaction` configuration
plus multiple instances of the same row participating in one transaction, and
one needs `before_commit` callbacks running in REVERSE definition order
(transaction.ts:638 references
`runCommitCallbacksOnFirstSavedInstancesInTransaction`, so the flag plumbing is
partly present).

Blocks un-skipping (transaction-callbacks.test.ts):

- updated callback called on first to save when followed in transaction by destroy from separate instance with old configuration (rails transaction_callbacks_test.rb:982)
- destroyed callbacks called on first saved instance in transaction with old configuration (rails:1010)
- before commit actions (rails:629 — reverse-order after_commit firing)

## Acceptance criteria

- [ ] The deprecated old-config behaviour fires update/destroy commit callbacks on
      the first-saved instance; `before commit actions` reverse ordering matches Rails.
- [ ] The 3 tests above are un-skipped and pass; no new gate-mismatches.
