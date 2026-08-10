---
title: "route-adapters-through-raw-execute"
status: closed
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
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
closed-reason: "superseded: wire-raw-execute-through-log now records what landed and stays open for the adapter routing"
---

## Context

`wire-raw-execute-through-log` converged the abstract primitive:
`rawExecute` (`connection-adapters/abstract/database-statements.ts`) now wraps
its `withRawConnection`/`performQuery` call in `this.log(...)` and threads
`notificationPayload` into `performQuery`, matching
`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`.
`rawExecQuery` lost its own `log` wrap, since Rails' `raw_exec_query` is
`cast_result(raw_execute(...))` (`database_statements.rb:541-543`) and would
otherwise emit `sql.active_record` twice.

Two pieces of that story were NOT done and are the work here:

1. **`internalExecQuery` still wraps in `log`.** Rails'
   `internal_exec_query` is `cast_result(internal_execute(...))`
   (`database_statements.rb:546-548`) — no log of its own; `internal_execute`
   reaches `log` through `raw_execute`. The trails wrap survives because the
   abstract body is reached only by a host that overrides `internalExecute`
   but not `internalExecQuery`, and for such a host `log`'s rescue is the only
   thing calling `set_query` on a translated `StatementInvalid` — asserted by
   `database-statements.test.ts` "attaches sql and binds to a translated
   StatementInvalid via set_query". Removing the wrap needs that context
   re-established at the Rails site first.

2. **No adapter routes through `rawExecute` at all.** SQLite3, MySQL2 and PG
   each override `internalExecute` / `internalExecQuery` and call their own
   private `_performQuery` under their own `this.log(...)`
   (`sqlite3-adapter.ts:460,592`; `mysql2-adapter.ts:975,1018`;
   `postgresql-adapter.ts:1728`). None exposes a public `performQuery`, so the
   abstract `rawExecute` still raises `NotImplementedError`
   (`database_statements.rb:561`) on every adapter and is dead in production.
   Rails' layering is `internal_execute -> raw_execute -> log ->
with_raw_connection -> perform_query`; converging it means each adapter
   exposing `performQuery` at the Rails name and dropping its own `log` call.

## Acceptance criteria

- [ ] Each adapter exposes `performQuery` at the Rails name (not a private
      `_performQuery`) and its `internalExecute` reaches it through the shared
      `rawExecute`, so `log` is called exactly once per statement from the
      abstract primitive.
- [ ] `internalExecQuery` drops its `log` wrap, with `set_query` context still
      attached to a translated `StatementInvalid` on the path that lost it.
- [ ] No path emits `sql.active_record` twice; a query emits exactly one event
      with the correct `row_count`, sourced from the payload `performQuery`
      mutated.
- [ ] Decide and record what savepoint / `BEGIN` statements emit — Rails logs
      them with `name: "TRANSACTION"` (`abstract/savepoints.rb`,
      `mysql2-adapter.ts:1070,1107`), which is a new notification stream for
      any test asserting notification counts.
- [ ] `support/ddl-profile.ts` patches `execute`/`executeMutation` as "the two
      leaf primitives" (`ddl-profile.ts:16-19,252-260`); re-check that
      assumption once `rawExecute` is the leaf.
