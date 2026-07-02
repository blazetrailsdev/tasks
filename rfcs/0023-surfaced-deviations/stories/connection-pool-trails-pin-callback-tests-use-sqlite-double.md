---
title: "connection-pool.trails pin/callback tests run against a sqlite-only double, not lane-native adapters"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 4432
claim: "2026-07-02T18:45:54Z"
assignee: "connection-pool-trails-pin-callback-tests-use-sqlite-double"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-pool.trails.test.ts` was converged
(PR #4396) so its pools are built from the ambient lane adapter
(`makeAmbientPool` + `ambientPoolConfiguration`), giving real
sqlite/postgres/mysql coverage. But the transaction-pin and
checkout/checkin-callback tests still drive a hand-written
`TransactionAwareTestAdapter` double (`connection-pool.trails.test.ts`, the
`class TransactionAwareTestAdapter` + `makeTransactionAwarePool` helper). The
double hardcodes `adapterName => "sqlite"` and has no real backend, so these
~15 tests (pin isolation across execution contexts, concurrent checkouts
within a pinned context, fixture pin survival, `_pinnedCount` wiring,
`decrements _pinnedCount when beginTransaction throws`, checkin `:after`
callbacks, `setCallback`) run against the double on EVERY lane — the
`setCallback` test even asserts `calls).toEqual(["sqlite"])` regardless of the
active lane. That subset therefore does not actually exercise a lane-native
transaction manager, undercutting the "run against all lane adapters" goal for
those tests.

Vendored Rails `connection_pool_test.rb:875-984` exercises pin_connection! /
unpin_connection! against the real `@pool` connection (RealTransaction /
SavepointTransaction / NullTransaction instances), not a double.

The double exists because these tests inspect transaction-manager internals
(`openTransactions`, `currentTransaction.joinable`, a `verifyBang` spy) that a
real lane adapter makes harder to drive deterministically in a unit test.

## Acceptance criteria

- The pin/unpin and checkout/checkin-callback tests exercise a lane-native
  adapter's transaction manager (via `makeAmbientPool` / `newRawTestAdapter`),
  not the `TransactionAwareTestAdapter` sqlite-only double — OR, if a real
  adapter genuinely cannot express these invariants as a deterministic unit
  test, document why per test and close as ratified-with-reason (do NOT leave
  the divergence untracked).
- No pin/callback assertion hardcodes `"sqlite"` on a non-sqlite lane.
- Test names stay verbatim; `test:compare` delta non-negative.
