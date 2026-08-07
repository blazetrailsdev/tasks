---
title: "Port raw_connection.block: drain the cancelled query before ROLLBACK"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6165
claim: "2026-08-07T02:08:30Z"
assignee: "datetime-to-s-drops-the-time-of-day"
blocked-by: null
closed-reason: null
---

## Context

Rails' `cancel_any_running_query`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127`)
does two things:

```ruby
@raw_connection.cancel
@raw_connection.block
```

`block` waits for the cancelled query to finish draining before the ROLLBACK is
sent. trails' `_cancelAnyRunningQuery` (`postgresql-adapter.ts` ~2218) ports only
the `cancel` half: it opens a fresh `pg.Connection`, fires the 16-byte
CancelRequest, and returns immediately, leaving the cancelled query's promise to
reject on its own.

That missing half is the direct cause of the RFC 0061
`pg-query-canceled-unhandled-rejection` flake class: when the chain that issued
the cancelled query has been dropped (an aborted save cascade, a connection
heading back to the pool), nobody observes the rejection and it surfaces at run
end as an unattributed `QueryCanceled: canceling statement due to user request`.
The mitigation shipped so far narrows _when_ trails cancels (the ownership guard
added in #5655/#5660) rather than draining what it cancelled.

## Acceptance criteria

- `_cancelAnyRunningQuery` awaits the cancelled query's settlement before the
  caller issues ROLLBACK, mirroring `raw_connection.block`. Note this makes the
  method async — `execRollbackDbTransaction` / `execRestartDbTransaction`
  (`postgresql-adapter.ts` ~2120, ~2191) must await it.
- The rejection is observed (not swallowed at the pool boundary), so a dropped
  chain cannot produce a run-end unhandled rejection.
- Regression test: cancel a query whose issuing chain has been dropped, assert
  no unhandled rejection at run end and that ROLLBACK is sent only after the
  cancelled query settles.
- Rails' `rescue PG::Error` semantics are preserved: drain failures stay
  best-effort and must not mask the rollback.
