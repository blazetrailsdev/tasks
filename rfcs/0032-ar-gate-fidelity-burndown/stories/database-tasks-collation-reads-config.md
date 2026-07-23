---
title: "database-tasks-collation-reads-config"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T01:23:10Z"
assignee: "database-tasks-collation-reads-config"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails database tasks read collation
from the live database: `connection.collation`
(vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:36-38
and postgresql_database_tasks.rb:36-38). Trails reads the configured value
instead: `configurationHash.collation`
(packages/activerecord/src/tasks/mysql-database-tasks.ts:120-122,
tasks/postgresql-database-tasks.ts:127-129), so `collation()` reports nothing
for databases whose collation was not set in config, and never reflects the
actual database state.

## Acceptance criteria

- Both tasks' `collation` query the adapter's collation as Rails does
  (adapters' `collation` support ported where missing).
- Rails' database-tasks collation tests pass.
