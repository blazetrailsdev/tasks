---
title: "port-with-connection-acquisition-seam-for-the-arel-reader"
status: closed
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#6928
claim: "2026-08-23T17:39:45Z"
assignee: "converge-excluding-deferred-ids-marker-to-eager-materialization"
blocked-by: null
closed-reason: "Ratified/delivered: CLAUDE.md 'Relation is evaluated by an async query' (trails#7834) settles that a sync with_connection seam can only serve an already-leased connection — 'the settled shape, not a gap'. The reader now is exactly that shape: origin/main relation/query-methods.ts:1237-1240 arel() = (this._arel ??= connectionPool().withConnectionSync((c) => this.buildArel(c, aliases))), memoized like @arel ||=. Its remaining @missingRailsCall with_connection receipt is owned by sync-reads-of-async-reflection-retire-with-rfc-0073."
---

## Context

Rails' `arel` reader acquires through a block:

```ruby
def arel(aliases = nil) # :nodoc:
  @arel ||= with_connection { |c| build_arel(c, aliases) }
end
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1595`)

`converge-toarel-onto-with-connection-acquisition` (PR #6755) landed the
achievable half: both `{ sanitizeLimit }` stand-in objects are gone, and
`Relation#toArel` (`packages/activerecord/src/relation.ts`) now acquires with a
plain `this._conn()` lease — so `buildArel` always gets a real connection and a
model with no established pool raises `ConnectionNotEstablished` where Rails'
`with_connection` would. The connectionless Arel-building callers turned out to
be reachable-in-theory only: `buildFrom`'s duck-typed subquery arm
(`packages/activerecord/src/relation/query-methods.ts`) now calls
`resolved.toArel()` unconditionally, as Rails' `opts.arel` does, and the whole
AR suite is green on it.

What is NOT converged is the acquisition SHAPE. trails' `withConnection`
(`packages/activerecord/src/connection-handling.ts:396`) delegates to
`ConnectionPool#withConnection` (`connection-adapters/abstract/connection-pool.ts:1008`),
which is `async` and therefore `Promise`-returning; `Relation#toArel` is
synchronous and is called synchronously from ~30 sites (`toSql`, `updateAll`,
`deleteAll`, `selectAll`, `buildFrom`, the predicate builder). There is no
synchronous `with_connection` seam to port against, and the `@arel ||=` memo is
absent for the same reason.

## Acceptance criteria

- [ ] A synchronous `withConnection` acquisition seam exists (or `toArel` and
      every caller are made async), so the reader can be
      `with_connection { |c| build_arel(c, aliases) }` verbatim.
- [ ] `Relation#toArel` memoizes as `@arel ||=` does (query_methods.rb:1595).
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
