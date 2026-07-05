---
title: "Converge transaction-isolation-level tests to generic dual connections"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). The four
isolation-LEVEL subtests of `TransactionIsolationTest` in
`packages/activerecord/src/transaction-isolation.test.ts` (the `describeIfPg`
block) remain `wrong-gate`: rails `features=[transaction_isolation]` /
ts `adapters=[postgresql]`.

- "read uncommitted", "read committed", "repeatable read", "serializable"

They use `Tag` / `Tag2` each calling `establishConnection(PG_TEST_URL)` to get two
independent physical connections to the same DB (Rails' `establish_connection
:arunit` idiom) and assert real cross-connection isolation semantics. Converging
the gate to feature-only `transaction_isolation` requires:

1. A generic way to open two independent connections to the current test DB
   (pg + mysql), not a hardcoded `PG_TEST_URL` — likely a new exported helper in
   `test-adapter.ts` returning the active connection config/URL.
2. SQLite transaction-isolation support: `supports_transaction_isolation?` is ALL
   in supports.ts (Rails sqlite supports it), but trails' SQLite adapter raises
   `TransactionIsolationError` (see `TransactionIsolationUnsupportedTest`). This
   is an impl gap that must be closed (or these four tests guarded out of sqlite
   via ctx.skip with a BLOCKED note) before/at convergence.

Rails: vendor/rails/activerecord/test/cases/transaction_isolation_test.rb.

## Acceptance criteria

- [ ] Rewrite the four bodies to open two independent connections to the current
      test DB generically (no PG_TEST_URL hardcode); verify on pg + mysql.
- [ ] Resolve the SQLite isolation divergence (impl support, or BLOCKED ctx.skip
      with a registered impl sub-story) so the gate is feature-only
      `transaction_isolation` with no adapter restriction.
- [ ] `test:compare --package activerecord --gates` reports no wrong-gate for
      these four tests.
- [ ] Test names unchanged.
