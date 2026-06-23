---
title: "Verify the dropAllTables distinct-table fan-out actually shrank after the raw-SQL teardown burndown"
status: claimed
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-23T13:32:53Z"
assignee: "ar-test-reset-verify-raw-sql-burndown-churn-payoff"
blocked-by: null
---

## Context

PR #3976 (`ar-test-reset-raw-sql-teardown-burndown`) burned the
`require-table-teardown` raw-SQL grandfather list
(`eslint/require-table-teardown-raw-sql-exclude.json`) from 39 files to `[]`.

The story's premise (from `docs/infrastructure/ar-test-reset-drop-table-churn-audit.md`)
was that these un-torn-down raw `CREATE TABLE`s are "the bulk of the ~2,600
distinct tables the `dropAllTables` fan-out re-drops every run", so adding
teardown should shrink that distinct-table count.

While implementing, it turned out that the **majority** of the 39 files'
flagged tables were already torn down at runtime — by `withTransactionalFixtures`
rollback (PG DDL is transactional), `DROP SCHEMA … CASCADE`, dynamic
`LIKE 'ex_%'` cleanup sweeps, or simply living in throwaway `:memory:`/temp-file
databases discarded on close. The lint rule flagged them only because the drops
were **dynamic / not statically visible**; the added `DROP TABLE IF EXISTS`
statements are in many cases no-op-by-name lint balancers, not new real teardown.

This means the expected `dropAllTables` distinct-table fan-out reduction may be
materially smaller than the audit headline implied. The real churn lever is
likely elsewhere (the audit's DROP-dominance finding: ~12:1 drop:create, 86k
drops/run — see `batch-drop-all-tables-single-statement` and the DDL_PROFILE
profiler).

## Acceptance criteria

- Re-run the distinct-table / `dropAllTables` churn measurement
  (DDL_PROFILE profiler, the same methodology as the
  `ar-test-reset-drop-table-churn-audit.md`) on `main` after #3976 merged.
- Report the actual change in distinct-table count and `dropAllTables` fan-out
  vs the pre-burndown baseline.
- If the reduction is negligible (because the tables were already torn down at
  runtime), record that explicitly so RFC 0028 re-prioritises toward the
  DROP-dominance levers (`batch-drop-all-tables-single-statement`,
  per-file reset shape-stability) instead of further teardown burndown.
