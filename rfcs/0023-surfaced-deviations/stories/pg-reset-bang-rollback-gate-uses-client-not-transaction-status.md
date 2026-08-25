---
title: "resetBang gates ROLLBACK on _client, Rails gates on transaction_status"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into pg-reset-bang-no-connection-branch-should-connect (same method / same subsystem; all Rails file:line citations carried into the surviving body)"
---

## Context

`PostgreSQLAdapter#resetBang`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:2783-2791`)
gates its ROLLBACK on `if (this._client)` — trails' pinned-client field.

Rails gates on the connection's transaction status:

```ruby
# postgresql_adapter.rb:371-381
def reset!
  @lock.synchronize do
    return connect! unless @raw_connection

    unless @raw_connection.transaction_status == ::PG::PQTRANS_IDLE
      @raw_connection.query "ROLLBACK"
    end
    @raw_connection.query "DISCARD ALL"

    super
  end
end
```

The adapter already ports `transaction_status` — `get transactionStatus`
(`postgresql-adapter.ts:1981`, mirroring `PQtransactionStatus`) — and
`IDLE_TRANSACTION_STATUSES` is already used by `_cancelAnyRunningQuery`
(`postgresql/database_statements.rb:128`), so the Rails-shaped condition is
available at the call site with no new machinery.

The two are not equivalent: `_client` is non-null only when trails pinned a
client for an explicitly-begun transaction, whereas `PQTRANS_INTRANS` /
`PQTRANS_INERROR` also cover a transaction the server opened that trails did not
pin. Where they differ, trails skips a ROLLBACK Rails would send, leaving
DISCARD ALL to run inside an open transaction block.

Found while reviewing `resetBang` for PR #6365 (which removed a non-Rails
CancelRequest from the same method).

## Acceptance criteria

- `resetBang` gates the ROLLBACK on the transaction status, as
  `postgresql_adapter.rb:375-377` does, not on `_client`.
- The `_client = null` / `_inTransaction = false` bookkeeping keeps whatever
  gate it needs — it tracks trails' pinned client, which Rails has no analogue
  for, and is a separate concern from whether ROLLBACK is sent.
- A test covers the divergent case: a server-side transaction the adapter did
  not pin is rolled back by `resetBang`.

## Definition of done

PG suites green (`adapters/postgresql/**`, `connection-adapters/**`,
`adapter.test.ts`, `transactions.test.ts`) against PG 17.

## Verification

`pnpm parity:api:calls` — check whether the row for `reset!` moves.
