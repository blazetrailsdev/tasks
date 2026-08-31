---
title: "Give the SQLite and MySQL statement pools their dealloc/reset seats, and bodies to sqlite3 explain and the adapter's begin_transaction"
status: draft
updated: 2026-08-31
rfc: "0000-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 240
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five adapter-side singles, grouped because four of them are the same seat.

**StatementPool `dealloc` / `reset`.** Rails gives each adapter a nested
`StatementPool` whose `dealloc` frees the prepared statement:
`sqlite3_adapter.rb:93` declares the class and `:97` its `dealloc`;
`abstract_mysql_adapter.rb:51` is the MySQL twin. `sqlite3_adapter.rb`'s
`reset` is the second miss on the same nested class. Nested classes are in the
compare denominator (`compare.ts:2412-2423`) and are measured against the same
TS file, so the seat has to be a real member of the adapter's file, not a
free function or an inlined `finalize()` call.

**`sqlite3/database_statements.rb` `explain`** — Rails `:18`,
`def explain(arel, binds = [], _options = [])`; declaration-only in trails,
so the body exists somewhere other than
`connection-adapters/sqlite3/database-statements.ts`.

**`abstract_adapter.rb` `begin_transaction`** — declaration-only. Rails' real
body is `abstract/transaction.rb:506`
(`def begin_transaction(isolation: nil, joinable: true, _lazy: true)`),
flattened onto the adapter through the transaction manager, so the fix is to
make the adapter's seat a bodied delegation to the manager at the Rails name
rather than a bodyless signature.

Each is one member; splitting them into four PRs would cost four CI runs for a
combined diff well under the ceiling.

## Acceptance criteria

- `connection_adapters/sqlite3_adapter.rb` reaches **131/131**,
  `connection_adapters/abstract_mysql_adapter.rb` **138/138**,
  `connection_adapters/sqlite3/database_statements.rb` **18/18**, and
  `connection_adapters/abstract_adapter.rb` **399/399**.
- activerecord package total rises by 5.
- Each member keeps Rails' parameter names and order — `explain`'s third
  parameter is `_options` in Rails and stays underscore-prefixed.
- The SQLite and MySQL lanes pass; `pnpm parity:api:calls`, `:calls:args` and
  `:params` clean.

## Definition of done

A free function or an inlined `finalize()` call does not close this story; the nested `StatementPool` is measured as a class member of the adapter's file.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
```

Read all four file rows named in the acceptance criteria in one run.
