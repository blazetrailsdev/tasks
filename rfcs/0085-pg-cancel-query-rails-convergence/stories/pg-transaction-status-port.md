---
title: "Port PG transaction_status and gate the cancel on it"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6157
claim: "2026-08-06T15:03:06Z"
assignee: "d-new-by-frags-skips-the-second-civil-validation"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#isRetryableQueryError` (`postgresql-adapter.ts` ~5099) omits
Rails' `@raw_connection.transaction_status != PG::PQTRANS_INERROR` guard, and
its comment claims node-pg "does not expose the PG transaction status byte".
That is false: `pg-protocol` parses the ReadyForQuery status byte into
`ReadyForQueryMessage.status` ('I' idle / 'T' in transaction / 'E' failed
transaction) — see
`node_modules/.pnpm/pg-protocol@*/node_modules/pg-protocol/dist/parser.js`
(`parseReadyForQueryMessage`) and `messages.js` — and `pg.Client` emits it on
`client.connection`. No new dependency is needed.

Rails uses the same value in two places:

- `postgresql_adapter.rb` `retryable_query_error?` — the INERROR guard above.
- `postgresql/database_statements.rb:127` `cancel_any_running_query`:
  `return if @raw_connection.nil? || IDLE_TRANSACTION_STATUSES.include?
(@raw_connection.transaction_status)`, where
  `IDLE_TRANSACTION_STATUSES = [PG::PQTRANS_IDLE, PG::PQTRANS_INTRANS,
PG::PQTRANS_INERROR]` (line 124).

trails has no such port, so `_cancelAnyRunningQuery`
(`postgresql-adapter.ts` ~2218) gates on the invented `_queryInFlight` boolean
instead. See RFC 0085 for why the whole marker cluster is a deviation.

Note the mapping is not one-to-one: PQTRANS*ACTIVE (a query on the wire) has no
ReadyForQuery byte of its own — it is the state \_between* a query being sent and
the next ReadyForQuery arriving, so the port must track outstanding-query state
alongside the last status byte.

## Acceptance criteria

- A `transactionStatus` accessor on `PostgreSQLAdapter` (or the raw-connection
  wrapper) returning the Rails-equivalent state, sourced from the
  `readyForQuery` status byte plus outstanding-query tracking.
- `isRetryableQueryError` restores the `PQTRANS_INERROR` guard, and its
  incorrect "not exposed" comment is removed.
- `_cancelAnyRunningQuery` gates on `IDLE_TRANSACTION_STATUSES` rather than
  `_queryInFlight`; `_queryInFlight` is deleted if no caller remains
  (`_queryInFlightOwner` stays until the lock-leak story lands).
- Tests exercise each status transition (idle → in-transaction → failed
  transaction) against a real PG connection, and cover the INERROR retry gate.
