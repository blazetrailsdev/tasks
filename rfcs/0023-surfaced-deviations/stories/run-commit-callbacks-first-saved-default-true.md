---
title: "run_commit_callbacks_on_first_saved_instances_in_transaction default should be true (Rails class_attribute)"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 40
pr: 3895
claim: "2026-06-22T17:07:56Z"
assignee: "run-commit-callbacks-first-saved-default-true"
blocked-by: null
---

## Context

Rails declares `run_commit_callbacks_on_first_saved_instances_in_transaction`
as a `class_attribute` with `default: true`
(vendor/rails/activerecord/lib/active_record/core.rb:96), and
`prepare_instances_to_run_callbacks_on` reads
`record.class.run_commit_callbacks_on_first_saved_instances_in_transaction`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:354).

trails has no class-attribute default: `transaction.ts`
prepareInstancesToRunCallbacksOn reads
`record.constructor.runCommitCallbacksOnFirstSavedInstancesInTransaction`
guarded by `typeof ... !== "undefined" && ...`
(packages/activerecord/src/connection-adapters/abstract/transaction.ts ~635-650),
so an UNSET flag is treated as falsy → "keep last saved instance". Rails'
default `true` means "keep first saved instance". The two diverge whenever the
same persisted row participates in one transaction via multiple instances and
the model has NOT explicitly set the flag.

This was surfaced while implementing the old-config first-saved tests (PR #3502),
which set the flag explicitly and so do not exercise the default. The
divergence only matters for unset-flag callers.

## Acceptance criteria

- [ ] `Base` exposes `runCommitCallbacksOnFirstSavedInstancesInTransaction` as a
      class attribute defaulting to `true`, matching Rails core.rb:96.
- [ ] prepareInstancesToRunCallbacksOn keeps the FIRST saved instance by default
      (unset flag), and the `typeof !== "undefined"` guard is removed/adjusted.
- [ ] Any existing tests relying on the current keep-last default are reconciled
      to Rails (set the flag false explicitly where they mean the new behaviour),
      with no new gate-mismatches.
