---
title: "Claim the PG in-flight query marker when the query reaches the wire, not at _runQuery entry"
status: done
updated: 2026-07-30
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5660
claim: "2026-07-30T19:11:18Z"
assignee: "pg-cancel-marker-claimed-while-query-still-queued"
blocked-by: null
closed-reason: null
---

## Context

Review feedback on #5655 that was **not** included in the merged PR — the fix
was written and verified locally but never committed before merge.

PR #5655 added an ownership guard to
`PostgreSQLAdapter#_cancelAnyRunningQuery` (`postgresql-adapter.ts`): it records
the `TransactionManager` lock token of the chain that issued the in-flight query
(`_queryInFlightOwner`) and only cancels when it matches the token of the chain
requesting the rollback.

The reviewer correctly pointed out that as merged, `_queryInFlight` /
`_queryInFlightOwner` are claimed at the **top of `_runQuery`**, before
`_serializePinnedQuery` has awaited the previous maintenance tail. A same-chain
query that is merely _queued_ behind a foreign long-running query therefore
overwrites the owner while the foreign query is still the one on the wire; a
rollback from that same chain then passes the guard and cancels a statement it
does not own.

Rails scopes this to the current thread's connection state because
`cancel_any_running_query` only ever runs inside `@connection.lock.synchronize`
(`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:611`
→ `activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127`).
The TS marker needs to be claimed when the serialized query actually starts.

## The fix (written and verified locally, ~30 LOC)

Move the claim/release out of `_runQuery` and into `_serializePinnedQuery`,
after `await prev.catch(() => {})` and before `fn()`:

```ts
await prev.catch(() => {});
this._queryInFlight = true;
this._queryInFlightOwner = this._transactionManager.currentLockToken;
try {
  return await fn();
} finally {
  this._queryInFlight = false;
  this._queryInFlightOwner = null;
  release();
}
```

and delete the `isTxConn`-gated set/clear pair from `_runQuery` (the local
`isTxConn` then becomes unused; the outer `try`/`finally` wrapper around
`attempt()` collapses into the existing `try`/`catch`).

This also fixes the mirror hazard: with a single shared boolean, the _clear_ was
first-finisher-wins, so a fast queued query could clear the marker while a slow
query was still executing. Claiming inside the serializer means exactly one
query holds the marker at a time, matching the invariant the guard assumes.

Side effect worth noting in review: the marker then also covers the other
`_serializePinnedQuery` call sites (type-map lookups, DDL at
`postgresql-adapter.ts` ~1947-1977, 2434, 2799, 3434, 3442) which previously
never set it. That is more accurate, not less — those run sequentially on their
own chain, so they cannot produce a spurious same-token cancel.

## Verification notes / trap

I could **not** construct a test that fails before the change and passes after.
Two attempts both passed on the pre-fix code:

- `TransactionManager.synchronize` already serializes two public `execute` calls
  end-to-end on one adapter, so a second `execute` never reaches `_runQuery`
  while the first is on the wire. Instrumenting `_cancelAnyRunningQuery`
  confirmed it was entered with `_queryInFlight === false` — both queries had
  already completed, because acquiring the TM lock for the rollback body meant
  waiting out the `pg_sleep`.
- The overlap the serializer exists to prevent (its own docblock: "two calls
  that interleave desync the wire protocol") arises on internal/reentrant paths
  (`withRawConnection`'s reentrant branch, a chain that releases the lock with
  work still awaiting — the SAVEPOINT-vs-rollback case #5655 diagnosed), not
  through two public `execute` calls.

So either find an internal/reentrant construction that discriminates, or land
the change as a structural correction with the reasoning above and no new test
— but do **not** ship a test that passes on both sides.

Broad PG verification of the local change was clean: 152 files / 2910 tests
across `collection-proxy.test.ts`, `adapter.test.ts`, `adapters/postgresql/`,
`transactions.test.ts` and `connection-adapters/`, no unhandled rejections.

## Acceptance criteria

- `_queryInFlight` / `_queryInFlightOwner` are claimed and released inside
  `_serializePinnedQuery`, not at `_runQuery` entry.
- `_runQuery` no longer touches either field; no unused `isTxConn` left behind.
- Either a discriminating regression test, or an explicit note in the PR body
  explaining why none is possible (see above).
- Affected PG suites green; no unhandled rejection at run end.
