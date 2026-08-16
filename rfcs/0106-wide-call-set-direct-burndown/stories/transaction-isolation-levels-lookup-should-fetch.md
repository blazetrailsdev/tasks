---
title: "transaction_isolation_levels lookup should raise like Hash#fetch"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6589
claim: "2026-08-16T01:15:07Z"
assignee: "finder-methods-residue-find-with-ids-find-one-raise"
blocked-by: null
closed-reason: null
---

# transaction_isolation_levels lookup should raise like Hash#fetch

## Context

Rails (`connection_adapters/postgresql/database_statements.rb:68-70`):

```ruby
def begin_isolated_db_transaction(isolation)
  internal_execute(
    "BEGIN ISOLATION LEVEL #{transaction_isolation_levels.fetch(isolation)}",
    "TRANSACTION", allow_retry: true, materialize_transactions: false)
end
```

`transaction_isolation_levels` is a Hash and the lookup is `fetch`, so an
unknown level raises `KeyError: key not found: :bogus`.

trails' `transactionIsolationLevels()`
(`connection-adapters/abstract/database-statements.ts:1063-1070`) returns a
plain object, and `PostgreSQLAdapter#beginIsolatedDbTransaction`
(`postgresql-adapter.ts:2124+`) does `levels[isolation]` with a hand-written
`throw new Error("Unknown isolation level: ...")`. One `kind: "set"` row
(`fetch`) in the exclude shard after PR #6581.

This is a CLAUDE.md-listed idiom trap (`fetch` vs `??`): the two differ on a
stored `nil`/`false`, and the raised class and message differ from Rails'.

## Converged shape

- A `fetch` at the call site with Ruby semantics — raising on a missing key with
  Rails' `KeyError`-equivalent class and message, not a bare `Error` with an
  invented string.
- Applies to every adapter that reads `transactionIsolationLevels`, not only PG
  (`abstract/database-statements.ts:1047-1051` does the same
  `levels[isolationLevel] ?? isolationLevel` shortcut, which additionally
  _silently passes through_ an unknown level instead of raising — a second,
  worse divergence from `fetch`).
- Delete the row from the exclude shard and tighten the mark.

## Acceptance criteria

- [ ] An unknown isolation level raises the Rails class with Rails' message,
      asserted by test, from both the PG path and the abstract path.
- [ ] The abstract `levels[x] ?? x` pass-through is gone.
- [ ] `pnpm parity:api:calls` green; no baseline widened.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
