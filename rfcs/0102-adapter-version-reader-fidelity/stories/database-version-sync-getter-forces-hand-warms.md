---
title: "Sync databaseVersion getter cannot self-fetch, forcing hand-warms Rails has at no call site"
status: done
updated: 2026-08-13
rfc: "0102-adapter-version-reader-fidelity"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6451
claim: "2026-08-13T01:56:51Z"
assignee: "database-version-sync-getter-forces-hand-warms"
blocked-by: null
closed-reason: null
---

## Context

The root cause behind the blocked story
`rename-column-for-alter-hand-warms-database-version`, isolated in PR #6146 and
worth its own convergence story because it forces the same deviation at every
call site.

Rails' `database_version` reader
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:854-856`):

```ruby
def database_version
  pool.server_version(self)
end
```

`pool.server_version` issues the round-trip itself when unmemoized, so **every**
version-gated predicate (`supports_rename_column?`, `supports_check_constraints?`,
`supports_rename_index?`, …) is callable at any time with no preparation.

trails' `databaseVersion` is a **sync getter that throws when cold**
(`abstract-mysql-adapter.ts:409` → `abstract-adapter.ts:2206`; PR #6125 made the
throw reachable by removing the `?? -1` fallbacks). Every caller that might run
before the memo is warm therefore carries a hand-warm line Rails does not have:

- `abstract-mysql-adapter.ts` — `renameColumnForAlter`, `renameIndex`,
  `checkConstraints`
- `postgresql/schema-statements-class.ts:407` — `tableOptions`
- `postgresql-adapter.ts:3838` — `addIndex`
- `mysql2-adapter.ts:1735` — `configureConnection` (this one is genuinely
  justified: `checkVersion()` is sync and cannot issue the query)

**#6144 did not fix this.** It landed `port-pool-server-version-retire-get-database-version-memo-guard`
and re-spelled the warms as `await this.pool.serverVersion(this)`, but
`abstract/connection-pool.ts:126-134` memoizes only the _resolved_ value and
returns `getDatabaseVersion()`'s Promise for MySQL/PG. The sync getter still
cannot self-fetch, so main still warms at all six sites. Anyone reading the
prerequisite as "merged, therefore unblocked" will red the MariaDB lane —
`adapters/abstract-mysql-adapter/connection.test.ts:318` fails with
`databaseVersion is not available yet` (PR #6146, run 31058825999).

The real blocker is the sync/async gap, not the memo owner.

## Converged shape

Pick one of the two shapes that actually closes it, and apply it uniformly:

1. **Make the version-gated predicates async** and await them at their call
   sites, so `databaseVersion` can be fetched on demand. Largest blast radius —
   `supports_*` is read from schema-creation visitors and schema statements —
   but it is the shape that lets every hand-warm die.
2. **Guarantee the memo is warm by construction**: have connection
   establishment (not each caller) populate it for every adapter, so the sync
   getter is never cold on a live connection and the throw becomes genuinely
   unreachable. Cheaper, but must cover the standalone/not-yet-connected adapter
   paths that `Mysql2Adapter#configureConnection` deliberately bails out of.

Either way the outcome is the same: no method body carries a warm Rails does not
have, and `rename-column-for-alter-hand-warms-database-version` unblocks.

## Acceptance criteria

- [ ] `databaseVersion` is readable wherever Rails' `database_version` is, with
      no caller-side warm.
- [ ] All five unjustified hand-warms above are deleted; any survivor cites a
      genuine TS shortcoming at the call site.
- [ ] `rename-column-for-alter-hand-warms-database-version` is unblocked (or
      closed by this story).
- [ ] All three lanes green, MariaDB included —
      `connection.test.ts:318` is the canary.
