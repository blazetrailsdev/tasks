---
title: "Converge the vestigial PostgreSQL performQuery port onto the live primitive"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4939 folded PG's `execute`/`executeMutation` onto a single live
`_performQuery` primitive on the adapter. A second, DORMANT copy still exists:
`performQuery` exported from
`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`
and assigned onto the prototype at `postgresql-adapter.ts:5295`
(`(PostgreSQLAdapter.prototype as any).performQuery = performQuery;`) — nothing
calls `.performQuery`; the live path uses the private `_performQuery`.

This mirrors the sqlite3 situation resolved by
`converge-vestigial-sqlite3-perform-query` (done): the port was written against
a different call shape (rowMode:"array", its own bind rewriting) than the live
adapter's `_runQuery`-based path, so it could not be wired as-is.

Rails has ONE `perform_query` per adapter
(`postgresql/database_statements.rb:135`); two copies is the deviation.

## Acceptance criteria

- [ ] Converge the exported `performQuery` port and the adapter's private
      `_performQuery` into a single live primitive (either wire the port as the
      one `_performQuery` delegates to, or delete the unused port), so there is
      exactly one PG `perform_query`.
- [ ] Reconcile the call-shape gap (the port's rowMode:"array" + internal bind
      rewriting vs. `_runQuery`'s object-row path) rather than leaving both.
- [ ] Keep api:compare coverage pointing at the live primitive.
- [ ] PG adapter tests green (`ARCONN=postgresql`).
