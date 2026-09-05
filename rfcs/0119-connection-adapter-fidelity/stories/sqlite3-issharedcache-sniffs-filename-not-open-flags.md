---
title: "sqlite3 isSharedCache sniffs the filename string, not the open flags Rails reads"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #7282 while probing
`sqlite3-read-uncommitted-shared-cache-skip` (now blocked).

Rails reads the **open flags actually passed to the driver**
(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:472-474`):

```ruby
def shared_cache? # :nodoc:
  @config.fetch(:flags, 0).anybits?(::SQLite3::Constants::Open::SHAREDCACHE)
end
```

`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:819-823`
instead sniffs the database **filename string**:

```ts
isSharedCache(): boolean {
  const qIdx = this._filename.indexOf("?");
  if (qIdx === -1) return false;
  return this._filename.slice(qIdx).includes("cache=shared");
}
```

Those are not the same predicate, and on this driver they disagree. better-sqlite3
does not set `SQLITE_OPEN_URI`, so `new Database("file::memory:?cache=shared")`
opens a **literal file of that name** — probed on the worktree's better-sqlite3:

```text
a.name: file::memory:?cache=shared   memory: false
(and a file of that exact name appears on disk)
```

So `isSharedCache()` returns `true` for a connection that has no shared cache at
all. That is a false positive in the direction that matters: it is the guard on
`internal_begin_transaction`'s isolation branch
(`sqlite3/database_statements.rb:68`, ported at
`connection-adapters/sqlite3/database-statements.ts:145`), which is supposed to
raise "You need to enable the shared-cache mode…" precisely when the cache is not
shared. Today that raise is skipped for any filename containing `cache=shared`,
and the transaction then sets `PRAGMA read_uncommitted=ON` on a connection that
cannot honour it.

`packages/activerecord/src/adapters/sqlite3/transaction.test.ts` leans on the
false positive: `withConn({ sharedCache: true })` builds
`BetterSQLite3Adapter("file::memory:?cache=shared")` and the
`shared_cached? is true when cache-mode is enabled` case asserts
`isSharedCache() === true` — which passes only because of the filename sniff.
Its `afterEach` already unlinks the stray literal file, which is itself evidence
the file is being created.

## Acceptance criteria

- [ ] `isSharedCache()` reads the open flags/config the adapter actually opened
      with, as `sqlite3_adapter.rb:472-474` does — not the filename string.
      Rails' shape is `@config.fetch(:flags, 0).anybits?(SHAREDCACHE)`; trails
      needs the equivalent over whatever `openConfig()`
      (`sqlite3-adapter.ts:1774`) can honestly report for the resolved driver.
- [ ] A connection better-sqlite3 opened with no shared cache reports
      `isSharedCache() === false`, so `internalBeginTransaction`'s
      `read_uncommitted` guard raises as Rails does.
- [ ] `transaction.test.ts`'s `shared_cached? is true when cache-mode is enabled`
      / `... is false when cache-mode is disabled` still express Rails'
      `transaction_test.rb:6-18` intent. If no trails driver can currently open a
      shared cache, the true-arm has no reachable state — coordinate with
      `sqlite3-read-uncommitted-shared-cache-skip` (blocked, same driver limit)
      rather than keeping a filename sniff alive to satisfy it.
- [ ] No stray `file::memory:?cache=shared` file is created by the suite; the
      `afterEach` unlink in `transaction.test.ts` can then go.
