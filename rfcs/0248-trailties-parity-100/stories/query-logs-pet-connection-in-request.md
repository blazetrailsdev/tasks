---
title: "Base.connection inside a request fails in a booted multi-db app (query_logs_test Pet.connection)"
status: in-progress
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10725
claim: "2026-11-24T21:07:00Z"
assignee: "query-logs-pet-connection-in-request"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/railties/test/application/query_logs_test.rb:20-24` renders
`ActiveRecord::QueryLogs.call("", Pet.connection)` inside `UsersController#index`.
`Pet.connection` (`activerecord/lib/active_record/connection_handling.rb`, `def connection`)
returns `pool.active_connection` when the pool has no permanent lease, and Rails' request
lifecycle has one checked out for `Pet`'s (`animals`) pool by then.

trails#10642 ported that controller as `await Pet.leaseConnection()` in
`packages/trailties/test/application/query-logs.test.ts`, because `await Pet.connection()`
(`packages/activerecord/lib/connection-handling.ts`, `connection`) made
"controller actions have tagging filters enabled by default" and "query cache is cleared
between requests" render the error page in the booted production app. The cause was not
confirmed: either `activeConnection` is `null` for the `animals` pool mid-request (no
lease taken where Rails has one), or `permanentConnectionCheckout` raises.

## Acceptance criteria

- [ ] Find why `Pet.connection()` fails inside a request in a booted multi-db app, and
      fix `packages/activerecord/lib` (or trailties' executor hooks) to match Rails.
- [ ] `query-logs.test.ts`'s `UsersController#index` uses `await Pet.connection()`, as
      `query_logs_test.rb:22` does, and all 18 tests pass.
