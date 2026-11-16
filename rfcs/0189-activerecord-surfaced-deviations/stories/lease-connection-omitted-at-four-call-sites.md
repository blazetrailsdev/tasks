---
title: "lease-connection-omitted-at-four-call-sites"
status: draft
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `query-assertions-keyword-arg-and-materialize-transactions`, whose
query-assertion half landed (signature converged to Rails' kwargs shape,
`materializeTransactions` called as `query_assertions.rb:19`). The absorbed
story's second criterion was not done: four other sites omit Rails'
`lease_connection` call and each needs a verdict.

- `packages/activerecord/lib/connection-handling.ts` `connection`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb`, `connection`)
- `packages/activerecord/lib/tasks/database-tasks.ts` `migrationConnection`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb`, `migration_connection`)
- `activerecord-test-support` `adapter-helper.ts` `currentAdapter?` and
  `load-schema-helper.ts` `loadSchema`

trails' `leaseConnection` is async, so sync callers use `leaseConnectionSync`.

## Acceptance criteria

- Each site calls `leaseConnection` (or `leaseConnectionSync`) where Rails calls
  `lease_connection`, or carries a call-site receipt naming the language reason.
- `pnpm parity:api:calls` stays green.
