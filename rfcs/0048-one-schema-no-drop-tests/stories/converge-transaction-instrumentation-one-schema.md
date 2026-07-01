---
title: "converge-transaction-instrumentation-one-schema"
status: in-progress
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4358
claim: "2026-07-01T02:24:48Z"
assignee: "converge-transaction-instrumentation-one-schema"
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

## RFC 0048 working notes (added 2026-07-01)

Two conventions apply when (re)writing tests under this RFC:

- **Use the fixtures helper; do not hand-call `registerModel`.** The
  Rails-faithful `fixtures()` / `setupFixtures()` surface is merged (#4345; the
  old `useHandlerFixtures` / `setupHandlerSuite` call sites were renamed to
  `fixtures` / `setupFixtures` in #4346). Declaring a fixture set now
  **auto-registers its model on resolution** (#4348,
  `fixtures-register-model-on-resolution`) — mirroring Rails `fixtures :authors`.
  So declare the fixture set and let resolution register the model; do **not**
  add manual `registerModel(...)` lines for a fixture-backed model. (Association
  targets that have no fixture set of their own may still need an explicit
  register until the autoload fallback lands.)
- **`*.trails.test.ts` holds trails-only cases.** The `<name>.test.ts` file is a
  faithful word-for-word mirror of its Rails source. Any test case with **no
  Rails counterpart** (a trails-specific extension) belongs in a sibling
  `<name>.trails.test.ts` file — keep it out of the Rails-mirrored `.test.ts` so
  `test:compare` maps cleanly.
