---
title: "Three sqlite drivers silently drop SQLITE_OPEN_SHAREDCACHE, so isSharedCache() reports a cache they do not have"
status: ready
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7614, which closed
`sqlite3-shared-cache-capability-mask-is-a-non-rails-guard` by deleting the
`SqliteDriverCapabilities.sharedCache` mask so `isSharedCache()` is Rails'
body verbatim:

```ts
isSharedCache(): boolean {
  return anybits(fetch(this._config, "flags", 0), SQLite3Constants.Open.SHAREDCACHE);
}
```

(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, mirroring
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:472-474`.)

That is honest in Ruby because `sqlite3_adapter.rb:35` hands the same options
hash — `:flags` included — to `SQLite3::Database.new`, which honours it. #7614
made it honest for ONE trails driver: `openConfig()` now forwards `flags`, and
`node-sqlite.ts`'s `sharedCacheDatabase()` translates `SQLITE_OPEN_SHAREDCACHE`
into a `?cache=shared` URI, which `node:sqlite` opens. Probed on this
worktree's Node 24.16: two `DatabaseSync` handles on
`file::memory:?cache=shared` see each other's uncommitted rows under
`PRAGMA read_uncommitted=ON`.

The other three drivers still drop the flag silently. better-sqlite3 takes
`{readonly, fileMustExist, timeout, verbose, nativeBinding}` and does not set
`SQLITE_OPEN_URI`; `expo-sqlite` takes neither; libsql takes neither. So a
`BetterSQLite3Adapter` configured with `flags: SHAREDCACHE` now reports
`isSharedCache() === true` for a connection that has no shared cache, and
`internal_begin_transaction` (`sqlite3/database_statements.rb:68`) will skip
its "You need to enable the shared-cache mode" raise and set
`PRAGMA read_uncommitted=ON` on a connection that cannot honour it.

This is the accepted residue of that story, not a regression to revert — the
mask was a guard Rails does not have and its removal was the AC. It is
recorded here so the remaining drivers get the same translation rather than the
guard coming back.

## Converged shape

Each remaining driver either honours `SQLITE_OPEN_SHAREDCACHE` the way
`sharedCacheDatabase()` does for `node:sqlite`, or — where the driver genuinely
cannot open a URI filename — the flag is rejected at open time rather than
dropped, so config and connection cannot disagree the way Ruby's cannot.
`isSharedCache()` is not touched: it stays Rails' one-liner.

Probe each driver's URI support before choosing the arm; better-sqlite3 was
probed as URI-incapable (`new Database('file::memory:?cache=shared')` creates a
literal file of that name), but that probe predates the current pinned version
and should be repeated.

## Acceptance criteria

- [ ] Every sqlite driver either honours `SQLITE_OPEN_SHAREDCACHE` or refuses
      an open that carries it, with the probe result recorded per driver.
- [ ] A driver that refuses raises at open, naming the flag — not at
      `internal_begin_transaction` time.
- [ ] `isSharedCache()` is unchanged and carries no capability guard.
- [ ] A test pins that a shared-cache-configured connection on each driver
      either shares a cache or failed to open.
