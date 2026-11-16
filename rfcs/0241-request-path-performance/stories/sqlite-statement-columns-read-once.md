---
title: "SQLite adapter reads a statement's columns once per query, not three times"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [activerecord]
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

Each query calls the native `stmt.columns()` three times, and each call
allocates a fresh array of column objects:

- `_maybeEnableReadBigInts` (`packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts:1175`)
  runs a `/bigint/i` test over every column type when the statement is prepared.
- `performQuery` (`connection-adapters/sqlite3/database-statements.ts`, about `:210`)
  maps the columns to names for the `Result`.
- `_narrowSpilledBigInts` (`sqlite3-adapter.ts:1183`) runs the same `/bigint/i`
  test again after every read.

The wrapper's `columns()` (`packages/activerecord/lib/sqlite/better-sqlite3.ts:119`)
then copies each native column object into a second object. Under the
twelve-dollar load this is **1.7% of busy CPU**. Rails reads
`stmt.columns` once, in `perform_query`
(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:90`).

## Acceptance criteria

- [ ] The wrapper computes the column names and the "has a bigint column" flag once
      per prepared statement, and `performQuery` and both bigint checks reuse them.
- [ ] Results are unchanged, including the narrowing of spilled bigints, and the
      SQLite adapter tests stay green.
- [ ] `columns` falls below 0.3% of busy CPU in the profile.

## Verification

Run the slim profile harness from the RFC README's Verification section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
