---
title: "Root-cause the PG QueryCanceled flake from the pg-cancel-trace output"
status: draft
updated: 2026-09-15
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The run-end `Unhandled Rejection: ActiveRecord::QueryCanceled` recurred on main @88583d26
(run 34914036662, job 104209801929, `Active Record PostgreSQL Tests (2)`; closed as flake
under red-88583d26) after PRs #5655, #6363 and #6365. This time the abandoned query was a
singular association load outside any transaction:
`_loadSingularViaStatementCache` (`packages/activerecord/src/associations.ts:528`) →
`StatementCache.execute` → `ConnectionPool.withConnection` → `internalExecQuery` →
`PostgreSQLAdapter.log`.

Rails reaches `cancel_any_running_query` only from `exec_rollback_db_transaction` /
`exec_restart_db_transaction`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:79,84,127-133`),
and it blocks on the cancelled command. A cancel landing on a non-transactional read means
either a trails cancel path Rails doesn't have, or a cancel sent from SQL
(`pg_cancel_backend`) in a test.

PR #7769 added `packages/activerecord/src/test-setup-pg-cancel-trace.ts`. On the next
occurrence the job log will contain a `[pg-cancel-trace]` block listing every adapter
cancel in that worker (pid, transaction status, test/file, stack) plus the cancelled SQL.

## Acceptance criteria

- On the next recurrence, root-cause the flake from the `[pg-cancel-trace]` output and
  state it with that evidence. An empty cancel list points at a `pg_cancel_backend` call
  site or a cross-worker cancel.
- Converge the offending path to Rails' shape: cancels only from rollback/restart, and only
  on the chain's own in-flight command.
- Once the cause is fixed, delete `test-setup-pg-cancel-trace.ts` and its
  `vitest.config.ts` entry, or keep it with a stated reason.
