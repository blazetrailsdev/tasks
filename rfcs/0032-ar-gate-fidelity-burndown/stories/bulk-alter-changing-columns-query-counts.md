---
title: "Port assert_queries_count to bulk_alter changing-columns tests"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-23T01:08:56Z"
assignee: "bulk-alter-changing-columns-query-counts"
blocked-by: null
closed-reason: null
---

# Port assert_queries_count to bulk_alter changing-columns tests

## Context

PR #5079 converged "changing columns" and "changing column null with default"
(`packages/activerecord/src/migration.test.ts`, BulkAlterTableMigrationsTest
block near the end of the file) to generic adapter bodies, but omitted Rails'
query-count assertions:

- vendor/rails/activerecord/test/cases/migration_test.rb:1403-1417 —
  `assert_queries_count(3, include_schema: true)` around the bulk change
  (Mysql2Adapter 3 / PostgreSQLAdapter 3).
- migration_test.rb:1433-1449 — `assert_queries_count(7|5, include_schema: true)`
  (Mysql2 7 / PG 5).

trails already has the helper: `assertQueriesCount` in
`packages/activerecord/src/testing/query-assertions.ts:61`, including the
`includeSchema` option (line 63). Wrap the second `changeTable(bulk)` call in
each test with the adapter-appropriate expected count, branching on
`adapterType` exactly as Rails branches on the adapter class name.

## Acceptance criteria

- [ ] Both tests assert the bulk change's query count with
      `includeSchema: true`, with per-adapter expected counts mirroring
      migration_test.rb's hash (mysql 3/7, postgresql 3/5).
- [ ] Counts verified on the pg and mysql lanes; sqlite stays gated out via
      the existing `describeIfSupports("bulk_alter")`.
- [ ] Test names unchanged.
