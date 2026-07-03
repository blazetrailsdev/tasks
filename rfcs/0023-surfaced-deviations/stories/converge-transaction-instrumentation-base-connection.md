---
title: "Converge transaction-instrumentation.test.ts onto Base.connection (fix TM savepoint-state leak across shared-pool tests)"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4520
claim: "2026-07-03T22:55:08Z"
assignee: "converge-transaction-instrumentation-base-connection"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up surfaced during `converge-misc-sidecar-callers` (PR #4512).
All other suites in that batch converged onto `Base.connection`, but
`transaction-instrumentation.test.ts` deliberately keeps a fresh per-test
`BetterSQLite3Adapter(":memory:")` (`freshIsolatedAdapter`,
`packages/activerecord/src/transaction-instrumentation.test.ts:33-61`) instead of
riding `Base.connection`.

Rails' counterpart (`vendor/rails/activerecord/test/cases/transaction_instrumentation_test.rb`)
runs under `ActiveRecord::TestCase` with `use_transactional_tests = false` and
drives `ActiveRecord::Base.connection` — it does NOT build a private adapter.

Trails cannot converge today because routing these tests through the shared
pool carries residual TransactionManager state across tests: on MariaDB a prior
test's abandoned savepoint stack surfaces as a stray
`ROLLBACK TO SAVEPOINT active_record_1` in the next test (documented in the
file's block comment, lines 13-32). The isolated adapter is a workaround, not a
Rails-faithful shape.

## Root cause to fix

The TransactionManager / pooled-adapter does not fully reset its savepoint /
open-transaction state between test cases sharing the same pooled connection.
Converging requires that a fresh checkout (or per-test reset) leaves no
savepoint-stack residue, so the shared-pool `Base.connection` path is
deterministic and adapter-agnostic.

## Acceptance criteria

- `transaction-instrumentation.test.ts` rides `Base.connection` (via
  `fixtures({ topics: [...] }, { useTransactionalTests: false })`) with no
  private `:memory:` adapter and no `freshIsolatedAdapter` helper.
- No stray `ROLLBACK TO SAVEPOINT` leakage across tests on any lane
  (sqlite/postgres/mariadb).
- Test names unchanged; `test:compare` delta >= 0.
- If the TM state-isolation fix is non-trivial, split it into its own story and
  land it first.
