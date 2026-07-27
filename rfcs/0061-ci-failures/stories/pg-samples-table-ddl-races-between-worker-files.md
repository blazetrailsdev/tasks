---
title: "PG transaction test files drop each other's samples table on the shared CI database"
status: in-progress
updated: 2026-07-27
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5443
claim: "2026-07-27T19:29:50Z"
assignee: "pg-samples-table-ddl-races-between-worker-files"
blocked-by: null
closed-reason: null
---

## Context

Two PostgreSQL test files each create and drop a `samples` table of the same
name in `beforeEach` / `afterEach`, against the **shared** CI database:

- `packages/activerecord/src/adapters/postgresql/transaction.test.ts:25-30`
  — `DROP TABLE IF EXISTS samples` / `CREATE TABLE samples (id int PRIMARY KEY, value integer)`
- `packages/activerecord/src/adapters/postgresql/transaction-nested.test.ts:32-39`
  — `DROP TABLE IF EXISTS samples, bits` / same `CREATE TABLE samples`

Vitest assigns each file to a worker, so these two files can run
**concurrently in different workers**. One file's `afterEach`
`DROP TABLE IF EXISTS samples` can drop the table the other file is mid-test
against, producing `42P01 relation "samples" does not exist` attributed to a
test that did nothing wrong.

This is the same class of shared-CI-database cross-worker interference as
[[pg-cancel-backend-pattern-cancels-sibling-workers]] (fixed in #5437, which
scoped `pg_cancel_backend` to the test's own pid). That fix addressed the
_cancel_; this is the remaining _DDL_ half of the same hazard in the same
pair of files.

Note the table itself is faithful, not a bespoke invention: Rails'
`vendor/rails/activerecord/test/cases/adapters/postgresql/transaction_test.rb:20-27`
also creates `samples` inline in `setup`. Rails runs single-process, so the
name collision is harmless there; trails forks 6 workers onto one database.
So the fix is worker isolation, **not** moving `samples` into the canonical
schema.

Not yet observed in CI — filed from a read of the two files while fixing
PR #5437. Confirm the interleaving is reachable before investing in a fix.

## Acceptance criteria

- The two files can no longer drop each other's `samples` table (e.g.
  per-worker table name suffix, or a shared serializing guard), with the
  approach justified at the call site.
- Test names still match Rails verbatim.
