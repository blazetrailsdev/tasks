---
rfc: "0000-transaction-fidelity"
title: "Transaction semantics fidelity"
status: draft
created: 2026-07-01
updated: 2026-07-01
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC — Transaction semantics fidelity

## Summary

Converge ActiveRecord transaction semantics onto Rails: validations run inside
the save transaction, `Relation#transaction` scope handling, transactional-fixture
abort recovery, failed-rollback instrumentation on real-DB lanes, faithful
transaction-callback bodies, and lazy-transaction materialization for unprepared
statements. Extracted from `0023-surfaced-deviations`.

## Motivation

Transaction deviations surfaced across several PRs — save not wrapping validations
in the transaction, `Relation#transaction` applying the wrong scope, fixture abort
recovery gaps, and lazy-transaction materialization diverging on PG/MySQL. Each is
a real Rails divergence with no topical home, so they collected in the catch-all.

## Design

- `save` runs validations inside the transaction (Rails ordering).
- `Relation#transaction` opens a transaction on a scoped relation without applying
  its scope.
- Transactional-fixture abort recovery: recover cleanly after a deliberately
  aborted transaction poisons teardown.
- Run failed-rollback transaction-instrumentation tests on the PG/MySQL lanes.
- Port `transaction-callbacks.test.ts` SetCallback/DestroyUpdateRace/ActionCondition
  bodies word-for-word from Rails.
- Unprepared SELECT materializes the lazy transaction on PG/MySQL.

## Non-goals

- **Callback halt semantics:** owned by closed 0039-callback-halt-semantics-convergence.

## Rollout

Members are largely independent. Suggested order: core save/scope semantics
(`save-runs-validations-inside-transaction`, `relation-transaction-on-scoped-relation`)
→ lazy-transaction + failed-rollback on real-DB lanes → fixture abort recovery and
the callback body port.

## Verification

Transaction and transaction-callback tests pass on all three adapter lanes;
validations demonstrably roll back with the save on failure.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
