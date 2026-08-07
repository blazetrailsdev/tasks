---
title: "_commandSettled misses the savepoint and DEALLOCATE issue sites"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6199
claim: "2026-08-07T20:32:46Z"
assignee: "converge-comment-or-changes-descriptor-spellings"
blocked-by: null
closed-reason: null
---

## Context

`_commandSettled` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`)
is the send-side half of `transactionStatus`: node-pg emits parsed backend
messages only, so nothing marks "a command went on the wire" — the flag is set
`false` where the query is issued and back to `true` by the terminating message
handlers. It is read by `transactionStatus`
(`... if (client.readyForQuery !== true && !this._commandSettled) return PQTRANS_ACTIVE`),
which gates `_cancelAnyRunningQuery` per
`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127-128`.

Before PR #6189 the flip lived in `_serializePinnedQuery`, so **every** pinned
`client.query` set it. With the mutex retired the flip was re-homed to the
issuing sites, and two groups were not covered:

- the SAVEPOINT / RELEASE SAVEPOINT / ROLLBACK TO SAVEPOINT queries in
  `executeMutation`'s INSERT-without-RETURNING path (`postgresql-adapter.ts`,
  the `_bt_ret_*` savepoint wrapper)
- the eviction DEALLOCATE issued from the `_rawConnection` setter's serializer

so `transactionStatus` can answer `PQTRANS_IDLE`/`PQTRANS_INTRANS` while one of
those is mid-cycle. Nothing observed it in the PG lane (the lock means the only
reader holds it), but the flag is now inconsistent with its own docblock.

## Converged shape

Rails has no `_commandSettled` — libpq's `PQtransactionStatus` reads the real
connection state, so the flag is a trails workaround for node-pg's missing
send-side event. Either:

1. flip it at every `client.query` on the pinned client (one helper, or the
   flip at each of the ~6 sites), so the invariant in its docblock holds; or
2. delete it and derive the active window from node-pg's own `activeQuery` /
   `readyForQuery` state, which is what libpq reports.

(2) is the closer shape if node-pg's state is trustworthy through the
CommandComplete→ReadyForQuery gap the docblock describes — check that first,
since that gap is exactly why the flag was introduced.

## Acceptance criteria

- [ ] `transactionStatus` reports `PQTRANS_ACTIVE` for the whole wire cycle of
      every query issued on the pinned client, savepoint and DEALLOCATE
      included — or `_commandSettled` is gone in favour of node-pg's own state.
- [ ] The docblock on the surviving mechanism matches what the code does.
