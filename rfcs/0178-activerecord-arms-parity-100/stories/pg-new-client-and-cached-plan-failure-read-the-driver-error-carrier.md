---
title: "activerecord: PG newClient rescues driver errors only; is_cached_plan_failure? reads through result"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open in review of trails#8491. Both sit behind
`pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`, which gives node-pg's errors one
carrier; that story's body covers `translateException` only.

- `PostgreSQLAdapter.newClient` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`)
  rescues every `Error` (`if (!(error instanceof Error)) throw error;`). Rails rescues `::PG::Error`
  only (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:57-71`),
  so an unrelated error thrown inside `connect()` is reclassified as `ConnectionNotEstablished` /
  `NoDatabaseError` / `DatabaseConnectionError`. node-pg raises connect failures as bare `Error`s
  ("Connection terminated unexpectedly", the timeout, SASL failures) and Node socket errors as coded
  `Error`s; only pg-protocol's `DatabaseError` is typed. Converged shape: the rescue guard tests the
  driver-error carrier and nothing else. The body also reads `database` / `user` / `host` off the
  `pg.Client` where Rails reads `conn_params[:dbname]` / `[:user]` / `[:host]`.
- `PostgreSQLAdapter#isCachedPlanFailure` reads `pgerror.code` / `pgerror.routine` directly. Rails reads
  `pgerror.result.result_error_field(PG::PG_DIAG_SQLSTATE)` and `…(PG::PG_DIAG_SOURCE_FUNCTION)`
  (`postgresql_adapter.rb:901-906`). Converged shape: both fields read through the carrier's `result`.
  A `@missingRailsCall result` receipt is rejected as stale today, because `result` is not a flagged
  call.

## Acceptance criteria

- [ ] `newClient`'s rescue matches driver errors only, with a test that a non-driver `Error` thrown during connect propagates unchanged.
- [ ] `newClient` reads the database, user and host from `connParams`.
- [ ] `isCachedPlanFailure` reads SQLSTATE and source function through `result`.
- [ ] The PostgreSQL adapter suite stays green.
