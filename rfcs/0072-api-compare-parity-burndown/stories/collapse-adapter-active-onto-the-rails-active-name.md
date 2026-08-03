---
title: "collapse-adapter-active-onto-the-rails-active-name"
status: ready
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `extra-surface-mysql2-and-libsql-per-file-singletons`
(PR #5947). That PR had to tag `Mysql2Adapter#activeAsync`
`@noRailsEquivalent PERMANENT` because trails splits Rails' single `active?`
into two names, and the second has nothing to converge onto.

Rails (`mysql2_adapter.rb:108`):

```ruby
def active?
  if connected?
    @lock.synchronize do
      if @raw_connection&.ping
        verified!
        true
      end
    end
  end || false
end
```

`active?` pings the raw handle **inline** and returns a boolean, because the
Ruby mysql2 driver blocks. node-mysql2's `ping()` returns a promise, so the ping
cannot happen inside a sync predicate. trails therefore exposes:

- `get active(): boolean` — Rails' `connected?` guard plus a cached
  `_activeState` flag, no live ping
- `async activeAsync(): Promise<boolean>` — the real ping, updating the cache

One Rails method, two trails names. Collapsing them back to a single Rails-named
`active` means making `active` awaitable package-wide.

**Blast radius (measured, not estimated):**

`get active()` is declared in 7 places:

- `connection-adapters/abstract-adapter.ts:1104` (base)
- `connection-adapters/postgresql-adapter.ts:238`
- `connection-adapters/sqlite3-adapter.ts:288`
- `connection-adapters/mysql2-adapter.ts:153`
- `support/fake-adapter.ts:57`
- test doubles: `connection-pool.test.ts:70`,
  `adapter-connection.trails.test.ts:44`

Non-test call sites are only **four**, and all four already sit inside `async`
functions, so awaiting them is mechanically straightforward:

- `abstract-adapter.ts:1325` — in `async verifyBang()`
- `abstract/transaction.ts:822` — in `async rollback()` (`conn.active !== false`;
  note the tri-state comparison, which an awaited promise would silently break —
  `Promise !== false` is always true)
- `abstract-mysql-adapter.ts:624` — in an async disable-referential-integrity path
- `sqlite3-adapter.ts:1407` — in `async reconnect()`

The bulk of the work is the ~68 `.active` references across `*.test.ts`.

The `transaction.ts:822` site is the sharp edge: `conn.active !== false` is
truthiness-sensitive, and an un-awaited promise there would pass the guard
unconditionally rather than fail loudly. Every call site must be audited
individually, not sed-swept.

## Acceptance criteria

- Decide, and record the decision in the story, whether the flip is worth it.
  A sync `active` that consults a ping cache is a defensible port of a blocking
  Ruby predicate; "matches the Rails name" is not automatically worth an
  await on every liveness check. If the answer is **no**, close this story by
  rewriting `activeAsync`'s `@noRailsEquivalent PERMANENT` reason in
  `mysql2-adapter.ts` to cite this decision, and stop there.
- If the answer is **yes**: `active` becomes async across all 7 declarations,
  `activeAsync` is deleted, and its `@noRailsEquivalent` tag goes with it.
- Every one of the 4 non-test call sites is audited by hand. In particular
  `abstract/transaction.ts:822` must not be left as `conn.active !== false`
  against a promise.
- Depends on `mysql2-connected-predicate-folds-in-cached-ping-state` landing
  first — that story fixes what `isConnected()`/`active` each mean, which
  determines what the merged `active` should return.
- `pnpm api:extra --package activerecord` shows the `activeAsync` novel entry
  gone and no new STALE tags.
- MySQL, PG and SQLite lanes green (MySQL needs a running server; CI covers it).
