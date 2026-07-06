---
title: "txn-fixtures-abort-recovery"
status: ready
updated: 2026-07-06
rfc: "0057-transaction-fidelity"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: 39
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails already mirrors Rails' `ActiveRecord::TestFixtures` transactional fixtures
(`packages/activerecord/src/test-helpers/with-transactional-fixtures.ts` +
`connection-adapters/abstract/connection-pool.ts:526-620`, per-test
`pinConnectionBang`/`unpinConnectionBang`, `beginTransaction({ joinable:false })`,
rollback-on-teardown; `usesTransaction` is the port of Rails'
`uses_transaction` from `test_fixtures.rb:88-95`).

The remaining gap: a test that deliberately raises `StatementInvalid` inside the
pinned transaction aborts the PG transaction, and trails does not always recover
cleanly — most likely because vitest `retry: 2` re-runs the test body WITHOUT
re-running `beforeEach`/`afterEach`, so the retry executes against the
already-aborted pinned connection ("current transaction is aborted, commands
ignored"). Rails/minitest has no per-test retry, so it never hits this and runs
such tests transactionally with no opt-out.

Today these tests must opt out via `useHandlerFixtures(..., { usesTransaction: [...] })`.
That workaround is used in ~8 test files / ~14 test names (e.g.
`relation/merging.test.ts` "relation merger leaves to database … multiple CTEs
with same alias", `relation/select.test.ts`, `insert-all.test.ts`). It is more
than Rails needs.

Surfaced by PR #4161 (Relation#merge fidelity port).

## Acceptance criteria

- [ ] Deterministic repro: a deliberate `StatementInvalid` inside the pinned txn
      under vitest `retry` reproduces the "transaction is aborted" poisoning.
- [ ] Recovery is robust: after a caught SQL error that aborted the txn, the
      pinned connection is reset so the next statement/retry starts clean — e.g.
      re-pin (rollback + begin) at the start of each attempt, or detect the
      aborted state in `unpinConnectionBang` and `resetBang()` rather than only
      when `currentTransaction.open` is false (`connection-pool.ts:613-619`).
- [ ] Remove the `usesTransaction` opt-outs from the deliberate-error tests
      (~14 entries) and keep CI green on the PG lane (`ARCONN=postgresql`),
      including under `retry`.
