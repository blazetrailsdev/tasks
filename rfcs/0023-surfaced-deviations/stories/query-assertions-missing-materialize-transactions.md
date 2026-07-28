---
title: "assert_queries_count omits lease_connection.materialize_transactions"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `assert_queries_count` opens with
`ActiveRecord::Base.lease_connection.materialize_transactions`
(`vendor/rails/activerecord/lib/active_record/testing/query_assertions.rb:19`),
and `assert_queries_match` does the same. trails'
`packages/activerecord/src/testing/query-assertions.ts` has no `leaseConnection`
call at all, so pending transactions are not materialized before the query
count starts — any lazily-materialized `BEGIN` lands inside the counted window.

Surfaced by PR #5520: a helper there was briefly named `leaseConnection` with an
argument, which flipped `isPortedWithArgs` (`scripts/api-compare/compare.ts:236`)
and made every `lease_connection` call in the package significant to the wide
calls gate. The helper was renamed, so the gate no longer reports it — but the
missing call is real and independent of that accident. Same omission exists in
`connection-handling.ts#connection`, `tasks/database-tasks.ts#migration_connection`,
and `activerecord-test-support`'s `adapter-helper.ts#current_adapter?` /
`load-schema-helper.ts#load_schema`; several of those are deliberate (trails'
`leaseConnection` is async, so sync callers use `leaseConnectionSync`), so each
needs its own verdict.

## Acceptance criteria

- `assert_queries_count` / `assert_queries_match` materialize transactions
  before counting, matching query_assertions.rb:19 (or the deviation is
  justified at the call site if trails' async lease makes it impossible).
- The other four `lease_connection` sites are triaged: implemented, or given a
  wide-exclude entry with a per-entry reason naming the sync-lease deviation.
- `pnpm api:calls:wide` stays green.
