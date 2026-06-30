---
title: "converge-transaction-instrumentation-one-schema"
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

Split out of `converge-instrumentation-one-schema` (RFC 0048): that story
covered two files but they exceed the 500-LOC PR ceiling together. The
`instrumentation.test.ts` half shipped separately; this story is the remaining
file.

`packages/activerecord/src/transaction-instrumentation.test.ts` must become a
faithful, word-for-word port of
`vendor/rails/activerecord/test/cases/transaction_instrumentation_test.rb`
(confirmed to exist). The current trails file already matches most Rails test
names but violates the RFC 0048 convergence contract:

- It paints `topics` onto a throwaway subclass via the `_tableName = "topics"`
  hack (`makeTopic`) instead of riding the canonical `Topic` model + real
  `topics` fixtures (`first`, `fifth`).
- It adds trails-invented tests with no Rails counterpart that must be deleted:
  `ConnectionFailed on commit invalidates the transaction and cascades to
children`, and the three `TM path: ...` tests.
- Rails gates `test_transaction_instrumentation_on_failed_rollback` /
  `..._when_unmaterialized` with `unless in_memory_db?`; preserve that mapping
  (the failed-rollback case is already permanently skipped — keep the rationale).

## Acceptance criteria

- [ ] `transaction-instrumentation.test.ts` mirrors
      `transaction_instrumentation_test.rb` word-for-word as closely as TS
      allows: same `it` names, same setup/fixtures, same assertions. Never
      invent or reword test names.
- [ ] Ride canonical `Topic` model + real `topics` fixtures
      (`useHandlerFixtures`/`useFixtures` on `topics`). No `_tableName` hack,
      no bespoke tables, no invented columns. Rails sets
      `self.use_transactional_tests = false` for this class — mirror via
      `usesTransaction` / non-transactional setup.
- [ ] Delete the four trails-invented tests listed in Context.
- [ ] Where a faithful port surfaces a trails impl gap, fix the impl or file a
      deviation under `0023-surfaced-deviations` and mark the case
      tracked-pending-convergence. A temporary `test:compare` regression is
      acceptable.
- [ ] Single PR from main under the 500-LOC ceiling. Test names match Rails
      verbatim.
