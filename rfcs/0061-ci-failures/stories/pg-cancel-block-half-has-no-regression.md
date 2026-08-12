---
title: "cancel_any_running_query's `block` half has no regression that reds without it"
status: done
updated: 2026-08-12
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6425
claim: "2026-08-12T16:36:52Z"
assignee: "pg-cancel-block-half-has-no-regression"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#_blockUntilCommandSettles`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:2081-2103`)
stands in for `PG::Connection#block` as `cancel_any_running_query` uses it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127-133`,
the `@raw_connection.block` on line 131). libpq's `block` returns once the
cancelled command's result is available; ours resolves off the first
`readyForQuery` / `commandComplete` / `errorMessage` / `end` / `error` event on
the pg connection, i.e. one protocol event earlier than the point at which the
driver has delivered the result to the caller's promise.

That gap is what PR #6422 hit: the regression
`cancelAnyRunningQuery does not leak its cancel onto a later query`
(`packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts:365`)
read `sleepError` immediately after the cancel returned and found `undefined`
on a loaded CI runner, because the cancelled `execute`'s rejection was still
walking its await chain. #6422 fixed the test (await the query, then assert)
and deliberately did NOT touch the adapter.

What is left uncovered: nothing exercises the `block` half itself. Deleting the
`await this._blockUntilCommandSettles(txClient)` line from
`_cancelAnyRunningQuery` (postgresql-adapter.ts:2065) leaves the whole
PG adapter trails suite green locally — the leak it prevents only reproduces
under the timing CI happens to have.

## Acceptance criteria

- A regression that reds when `_cancelAnyRunningQuery` returns without waiting
  for the cancelled command to come back, and is green with the wait in place.
  The `block` postcondition is observable synchronously: right after the cancel
  resolves, `adapter.transactionStatus` must no longer be `PQTRANS_ACTIVE`
  (postgresql-adapter.ts:1974-1986) — that is the same byte libpq derives
  `PQtransactionStatus` from, and it is set by the protocol listener rather
  than by a promise hop, so the assertion carries no microtask race.
- Verified failing on a baseline with the `block` await removed, per
  CONTRIBUTING's regression rule.
- No new adapter surface: the assertion reads existing members only.

## Definition of done

Test-only change in
`packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`;
existing Rails test names untouched; PG lane green.
